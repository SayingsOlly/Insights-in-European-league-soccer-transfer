function TeamDetailDiagram() {
    this.yearValues = years.map(function (d) { return parseInt(d.split('-')[0]); });
    this.yearTransferMetrix = [];
    this.teamAcSums = [];

    var me = this;

    var count = {value: 0};
    var max = {v:0};
    loadTeamYears(years, function (teams, teamTransfers, teamNameToIndex) {
        me.teams = teams;
        me.teamTransfers = teamTransfers;
        me.teamNameToIndex = teamNameToIndex;
        
        teams.forEach(function (d, yearIndex) {
            var teamTransfer = teamTransfers[yearIndex];

            var sum = 0;
            var acSum = {v:0};
            //teamTransfer.forEach(function (dd) {
            //    sum += dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (dd.value * 2);
            //});
            d.forEach(function (team, i) {
                sum += team.value;
            });
            d.forEach(function (team, i) {
                var outSum = team.transferOutValue;
                var inSum = team.transferInValue;

                //var outSum = d3.sum(teamTransfer, function (dd) {
                //    return dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (team.teamIndex == dd.sourceD.teamIndex ? dd.value : 0);
                //});
                //var inSum = d3.sum(teamTransfer, function (dd) {
                //    return dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (team.teamIndex == dd.targetD.teamIndex ? dd.value : 0);
                //});
                me.teamAcSums[i] || me.teamAcSums.push([]);
                me.teamAcSums[i].push({
                    acSum: sum - acSum.v - outSum - inSum,
                    outValue: outSum,
                    inValue: inSum,
                    value: inSum + outSum,
                    teamIndex: i,
                    team: team
                });
                acSum.v += outSum + inSum;
            });

            me.yearTransferMetrix.push({
                metrix: d,
                sumValue: sum,
                year: yearIndex,
            });

            max.v = Math.max(max.v, sum);
            count.value++;
            if(count.value == me.yearValues.length) {
                me.teamAcSums.forEach(function (d) {
                    d.push(me.yearValues.length - 1);
                    d.push(0);
                });
                me.init(max.v);
            }
        });
    }, true);

    me.tooltip();
}
TeamDetailDiagram.prototype.init = function (max) {
    this.svg = d3.select('#team-detail-chart-svg');

    var svgBounds = this.svg.node().getBoundingClientRect(),
        xAxisWidth = 40,
        yAxisHeight = 40,
        figureWidth = svgBounds.width - xAxisWidth - 13,
        figureHeight = svgBounds.height - yAxisHeight - 13,
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
        .domain([0, max])
        .range([yAxisHeight, figureHeight + 20]);

    this.yAxisScale = d3.scaleLinear()
        .domain([0, max])
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

    this.path = this.svg.select('.paths').selectAll('path').data(this.teamAcSums);
    this.svg.select('.overlay').on('click', function (d) {
        leagueSelectionBar.selectTeam(d[0].team.leagueIndex, d[0].team.name);
        //var tmp = new Set();
        //tmp.add(d[0].leagueIndex);
        //leagueSelectionBar.selectLeague(tmp, true, true);
    }).on('mouseout', function (d) {
        me.svg.select('.overlay')
            .style('display', 'none');
        me.svg.select('.labels').selectAll('text')
            .style('display', 'none');
        me.tip.hide(d);
    });

    var newPath = this.path.enter().append('path')
        .attr('d', function (d, i) {
            return me.aclineGenerator(d);
        })
        .style('fill', function (d) {
            return utils.color(d[0].team.leagueIndex);
        })
        .style('display', function (d) {
            return d3.max(d, function (d, i) {return i < dataLength ? Math.max(d.inValue, d.outValue) : 0;}) == 0 ? 'none' : 'inherit';
        });
    newPath.on('click', function (d, i) {
            leagueSelectionBar.selectTeam(d[0].team.leagueIndex, d[0].team.name);
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
                    return i < years.length ? (me.yAxisScale(d.acSum + d.value) - 12) : me.yAxisScale(d.acSum + d.inValue);
                });
            me.tip.show(d);
        });
    newPath.call(this.tip);
    this.path.exit().remove();
    this.path = newPath.merge(this.path);

    this.svg.select('.labels')
        .style("transform", "translate(" + 0 + "px," + svgBounds.height + "px)");
};

TeamDetailDiagram.prototype.buildACfromValue = function (teamNames) {
    var me = this;
    var max = {v:0};
    this.yearTransferMetrix.forEach(function (d, yearIndex) {
        d = d.metrix;
        var teamTransfer = me.teamTransfers[yearIndex];

        var sum = 0;
        var acSum = {v:0};
        //teamTransfer.forEach(function (dd) {
        //    if (teamNames.size == 0 || teamNames.has(dd.targetD.name) || teamNames.has(dd.sourceD.name)) {
        //        sum += dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (dd.value);
        //    }
        //});
        d.forEach(function (team, i) {
            if (teamNames.size == 0 || teamNames.has(team.name)) {
                sum += team.value;
            }
        });

        d.forEach(function (team, i) {
            var outSum = team.transferOutValue;
            var inSum = team.transferInValue;
            if (teamNames.size == 0 || teamNames.has(team.name)) {
                //var outSum = d3.sum(teamTransfer, function (dd) {
                //    return dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (team.teamIndex == dd.sourceD.teamIndex ? dd.value : 0);
                //});
                //var inSum = d3.sum(teamTransfer, function (dd) {
                //    return dd.sourceD.teamIndex == dd.targetD.teamIndex ? 0 : (team.teamIndex == dd.targetD.teamIndex ? dd.value : 0);
                //});
                me.teamAcSums[i][yearIndex].acSum = sum - acSum.v - outSum - inSum;
                me.teamAcSums[i][yearIndex].outValue = outSum;
                me.teamAcSums[i][yearIndex].inValue = inSum;
                me.teamAcSums[i][yearIndex].value = outSum + inSum;
                acSum.v += outSum + inSum;
                console.log(me.yAxisScale(me.teamAcSums[i][yearIndex].acSum +  outSum + inSum));
            } else {
                me.teamAcSums[i][yearIndex].acSum = sum - acSum.v;
                me.teamAcSums[i][yearIndex].inValue = 0;
                me.teamAcSums[i][yearIndex].outValue = 0;
                me.teamAcSums[i][yearIndex].value = 0;
            }
        });
        max.v = Math.max(max.v, sum);
    });
    return max.v;
};

//TeamDetailDiagram.prototype.selectLeague = function (league, leagues) {
//    var svg = d3.select("#force-direct-svg"),
//        me = this;
//
//    this.deselectNode();
//    if (leagues.size == 0) {
//        this.updateYear();
//    } else {
//        var names = new Set();
//        me.teams.forEach(function (team) {
//            if (leagues.has(team.leagueIndex))
//                names.add(team.name);
//        });
//        this.selectNodes(names);
//    }
//}
TeamDetailDiagram.prototype.reset = function () {
    this.selectNodes(new Set());
}

TeamDetailDiagram.prototype.selectNodes = function (teamNames) {
    var max = this.buildACfromValue(teamNames),
        me = this;
    this.yScale = this.yScale.domain([0, max]);
    this.yAxisScale = this.yAxisScale.domain([0, max]);

    this.svg.select("#yAxis")
        .transition().duration(1000)
        .call(this.yAxis);

    this.path.style('display', function (d, i) {
        return teamNames.size == 0 || teamNames.has(d[0].team.name) ? 'inherit' : 'none';
    }).transition().duration(1300)
        .attr('d', function (d, i) {
            return teamNames.size == 0 || teamNames.has(d[0].team.name) ? me.aclineGenerator(d) : '';
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
            return i < years.length ? (me.yAxisScale(d.acSum + d.value) - 12)  : me.yAxisScale(d.acSum + d.inValue);
        });
}

TeamDetailDiagram.prototype.tooltip = function () {
    this.tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('ne')
        .offset([-500, -800])
        .html(function(d) {
            var html = '';
            d = d[0].team;
            html += "<div style='padding-left: 4px; border-left: 12px solid "+utils.color(d.leagueIndex)+"'>"+ d.name+"</div>";
            html += "</div>";
            return html;
        });
}