function YearTrendDiagram() {
    this.yearValues = years.map(function (d) { return parseInt(d.split('-')[0]); });
    this.yearTransferMetrix = [];
    this.leagueAcSums = [];

    var me = this;

    var count = {value: 0};
    this.yearValues.forEach(function (year, yearIndex) {
        loadYears([year+'-'+(year+1)], function (d) {
            var sum = 0;
            var leagueSums = [],
                acSum = {v:0};
            d.forEach(function (dd, i) {
                dd.forEach(function (ddd, I) {
                    sum += I == i ? 0 : (ddd / 1000);
                });
                for (var I = 0; I < years.length; I++) {
                    sum += I == i ? 0 : (d[I][i] / 1000);
                }
            });

            d.forEach(function (dd, i) {
                var outSum = 0;
                var inSum = 0;
                dd.forEach(function (ddd, I) {
                    outSum += I == i ? 0 : ddd / 1000;
                });
                for (var I = 0; I < years.length; I++) {
                    inSum += I == i ? 0 : (d[I][i] / 1000);
                }
                leagueSums.push(inSum + outSum);
                me.leagueAcSums[i] || me.leagueAcSums.push([]);
                me.leagueAcSums[i].push({
                    acSum: sum - acSum.v - outSum - inSum,
                    outValue: outSum,
                    inValue: inSum,
                    value: inSum + outSum,
                    leagueIndex: i
                    //yearIndex: years.findIndex(function (d) { return d == (year+'-'+(year+1)); })
                });
                acSum.v += outSum + inSum;
            });

            me.yearTransferMetrix.push({
                metrix: d,
                sumValue: sum,
                year: year,
                leagueSums: leagueSums,
            });

            count.value++;
            if(count.value == me.yearValues.length) {
                me.leagueAcSums.forEach(function (d) {
                    d.push(me.yearValues.length - 1);
                    d.push(0);
                });
                me.init();
            }
        })
    });
}
YearTrendDiagram.prototype.init = function (yearTransferMetrix) {
    this.svg = d3.select('#year-trend-svg');

    var svgBounds = this.svg.node().getBoundingClientRect(),
        xAxisWidth = 40,
        yAxisHeight = 40,
        figureWidth = svgBounds.width - xAxisWidth - 13,
        figureHeight = svgBounds.height - yAxisHeight,
        dataLength = years.length,
        me = this;

    this.xScale = d3.scaleLinear()
        .domain(this.yearValues)
        .range(this.yearValues.map(function (d, i) {
            return xAxisWidth + i * (figureWidth - xAxisWidth) / (dataLength - 1);
        }));

    this.iScale = d3.scaleLinear()
        .domain([0, dataLength])
        .range([this.xScale(this.yearValues[0]), this.xScale(this.yearValues[dataLength - 1] + 1)]);

    var xAxis = d3.axisBottom();
    xAxis.ticks(dataLength)
        .scale(this.xScale);

    this.xAxis = this.svg.select("#xAxis")
        .style("transform", "translate(" + 0 + "px," + (yAxisHeight-1) + "px) scaleY(-1)")
        .transition().duration(1000)
        .call(xAxis);

    this.yScale = d3.scaleLinear()
        .domain([0, d3.max(this.yearTransferMetrix, function (d) {return d.sumValue;})])
        .range([yAxisHeight, figureHeight + 20]);

    this.yAxisScale = d3.scaleLinear()
        .domain([0, d3.max(this.yearTransferMetrix, function (d) {return d.sumValue;})])
        .range([figureHeight, 20]);

    this.yAxis = d3.axisLeft();
    this.yAxis.ticks(10)
        .scale(this.yAxisScale);

    this.svg.select("#yAxis")
        .style("transform", "translate(" + (xAxisWidth-2) + "px," + svgBounds.height + "px) scaleY(-1)")
        .transition().duration(1000)
        .call(this.yAxis);

    this.aclineGenerator = d3.line()
        .x(function (d, i) {
            return i < dataLength ? me.iScale(i) : me.iScale(d);
        })
        .y(function (d, i) {
            return i < dataLength ? me.yScale(d.acSum + d.value) : me.yScale(0);
        });

    this.overLaylineGenerator = d3.line()
        .x(function (d, i) {
            return i < dataLength ? me.iScale(i) : me.iScale(2 * dataLength - i - 1);
        })
        .y(function (d, i) {
            return i < dataLength ? me.yScale(d.acSum + d.value) : me.yScale(d.acSum + d.inValue);
        });

    this.path = this.svg.select('.paths').selectAll('path').data(this.leagueAcSums);
    this.svg.select('.overlay').on('click', function (d) {
        var tmp = new Set();
        tmp.add(d[0].leagueIndex);
        leagueSelectionBar.selectLeague(tmp, true, true);
    }).on('mouseout', function (d) {
        me.svg.select('.overlay')
            .style('display', 'none');
        me.svg.select('.labels').selectAll('text')
            .style('display', 'none');
    });

    var newPath = this.path.enter().append('path')
        .attr('d', this.aclineGenerator)
        .style('fill', function (d, i) {
            return utils.color(i);
        });
    newPath.on('click', function (d, i) {
            var tmp = new Set();
            tmp.add(i);
            leagueSelectionBar.selectLeague(tmp, true, true);
        })
        .on('mouseover', function (d, i) {
            var newD = [];//d.slice(0).splice(0, years.length);
            var tmp = [];
            d.forEach(function (d, i) {
                i <  years.length && newD.push(d);
            });
            newD.forEach(function (d) {tmp.unshift(d)});
            tmp.forEach(function (d) {newD.push(d)});
            me.svg.select('.overlay').data([newD])
                .style('display', 'inherit')
                .attr('d', me.overLaylineGenerator);

            me.labels =  me.svg.select('.labels').selectAll('text').data(newD);
            var newLabels = me.labels.enter().append('text');

            me.labels.exit().remove();
            me.labels = newLabels.merge(me.labels);

            me.labels
                .style('display', 'inherit')
                .html(function (d, i) {
                    var some = i < years.length ? ' out' : ' in';//(i == years.length * 2 - 1 ? ' in' : '');
                    return (i < years.length ? d.outValue : d.inValue) + some;
                })
                .attr('x', function (d, i) {
                    return i < years.length ? me.iScale(i) : me.iScale(2 * years.length - i - 1);
                })
                .attr('y', function (d, i) {
                    return i < years.length ? me.yAxisScale(d.acSum + d.value) : me.yAxisScale(d.acSum + d.inValue);
                });
        });
    this.path.exit().remove();
    this.path = newPath.merge(this.path);

    this.svg.select('.labels')
        .style("transform", "translate(" + 0 + "px," + svgBounds.height + "px)");
};

YearTrendDiagram.prototype.showLeagues = function (leagues) {
    var max = this.buildACfromValue(leagues),
        me = this;
    this.yScale = this.yScale.domain([0, max]);
    this.yAxisScale = this.yAxisScale.domain([0, max]);

    this.svg.select("#yAxis")
        .transition().duration(1000)
        .call(this.yAxis);

    this.path.style('display', function (d, i) {
        return leagues.size == 0 || leagues.has(i) ? 'inherit' : 'none';
    }).transition().duration(1300)
        .attr('d', function (d, i) {
            return leagues.size == 0 || leagues.has(i) ? me.aclineGenerator(d) : '';
        });

    me.svg.select('.overlay')
        .filter(function(d) {return d})
        .transition().duration(1300)
        .attr('d', me.overLaylineGenerator);

    this.svg.select('.labels').selectAll('text')
        .filter(function(d) {return d})
        .html(function (d, i) {
            var some = i < years.length ? ' out' : ' in';//(i == years.length * 2 - 1 ? ' in' : '');
            //var some = i == 0 ? 'transfer out' : (i == years.length * 2 - 1 ? 'transfer in' : '');
            return (i < years.length ? d.outValue : d.inValue) + some;
        })
        .transition().duration(1300)
        .attr('x', function (d, i) {
            return i < years.length ? me.iScale(i) : me.iScale(2 * years.length - i - 1);
        })
        .attr('y', function (d, i) {
            return i < years.length ? me.yAxisScale(d.acSum + d.value) : me.yAxisScale(d.acSum + d.inValue);
        });
};

YearTrendDiagram.prototype.buildACfromValue = function (leagues) {
    var me = this;
    var max = {v:0};
    this.yearTransferMetrix.forEach(function (d, yearIndex) {
        d = d.metrix;
        var sum = 0;
        var acSum = {v:0};

        d.forEach(function (dd, i) {
            if (leagues.size == 0 || leagues.has(i)) {
                dd.forEach(function (ddd, I) {
                    sum += I == i ? 0 : (ddd / 1000);
                });
                for (var I = 0; I < years.length; I++) {
                    sum += I == i ? 0 : (d[I][i] / 1000);
                }
            }
        });

        d.forEach(function (dd, i) {
            if (leagues.size == 0 || leagues.has(i)) {
                var outSum = 0;
                var inSum = 0;
                dd.forEach(function (ddd, I) {
                    outSum += I == i ? 0 : ddd / 1000;
                });
                for (var I = 0; I < years.length; I++) {
                    inSum += I == i ? 0 : (d[I][i] / 1000);
                }
                me.leagueAcSums[i][yearIndex].acSum = sum - acSum.v - outSum - inSum;
                acSum.v += outSum + inSum;
            }
        });
        max.v = Math.max(max.v, sum);
    });
    return max.v;
};