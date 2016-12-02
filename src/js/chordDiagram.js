var yearScale;

function yearChart(){

  var yearChart = d3.select("#year-chart");

  svgWidth = yearChart.node().getBoundingClientRect().width;
  svgHeight = 60;


  console.log(svgWidth);
  var svg = d3.select("#year-chart").append("svg")
      .attr("width",svgWidth)
      .attr("height",svgHeight);

  setUpBrush(years, svg, svgWidth, svgHeight);

  console.log(years);
  //scale
  yearScale = d3.scaleLinear()
      .range([0,svgWidth]).domain([0,years.length]);

  svg.append("path")
    .attr("class", "lineCharts")
    .attr("stroke","grey")
    .style("stroke-dasharray", ("3,3"))
    .style("z-index", "0")
    .attr("d", "M 0 20 L " + self.svgWidth + " 20");

  var yearCircle = svg.selectAll("circle")
      .data(years);

  yearCircle = yearCircle.enter().append("circle")
    .attr("class","year-circle")
    .attr("cx", function(d,i){
      return yearScale(i+0.5);
    })
    .attr("cy", "20px")
    .attr("r", "15px");

  var yearText = svg.selectAll("text").data(years);

  yearText.enter().append("text")
    .text(function(d){
      console.log(d);
      return d+"";
    })
    .attr("x", function(d,i){
      return yearScale(i+0.5);
    })
    .attr("y", "50px")
    .attr("dy", ".25em")
    .attr("dx","-2.0em");

  yearCircle.on("click", function(d,i){
    var circle = d3.select(this);
    yearCircle.classed('selected', false);
    circle.classed('selected', true);

    updateYears([circle.datum()]);
    clearBrush(svg);
  });

}

function buildChord(matrix, len = 1){
  // get the svg.
  var svg = d3.select("#chordSVG");

  // initiate.
  var width = +svg.attr("width");

  var height = +svg.attr("height");

  console.log(width);
  console.log(height);

  console.log("matrix");
  console.log(matrix);

  var outerRadius = Math.min(width,height) * 0.5 - 40;
  var innerRadius = outerRadius - 30;

  var chord = d3.chord()
      .padAngle(0.03)
      .sortSubgroups(d3.descending);

  var arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

  var ribbon = d3.ribbon()
      .radius(innerRadius);

  svg.selectAll("g").remove();
  var g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .datum(chord(matrix));

  var group = g.append("g")
      .attr("class", "groups")
      .selectAll("g")
      .data(function(chords){
        console.log(chords.groups);
        return chords.groups;
      })
      .enter()
      .append("g").attr("class","group");

  group.append("path")
    .attr("id", function(d){
      return "path"+d.index;
    })
    .style("fill", function(d){
      return utils.color(d.index);
    })
    .style("stroke", function(d){
      return d3.rgb(utils.color(d.index)).darker();
    })
    .attr("d", arc);

  //Text
  // var leagueText = group
  //     .append("g")
  //     .attr("class", "group-text")
  //     .attr("transform", function(d){
  //       return "rotate(" +(((d.endAngle - d.startAngle)/2+d.startAngle)*180/Math.PI-90) + ") translate(" +(innerRadius+outerRadius)/2 + ",0)";
  //     });

  // leagueText.append("text")
  //   .attr("x", -20)
  //   .attr("dy", ".35em")
  //   .attr("transform", function(d){
  //      return "rotate(90)";
  //   })
  //   .style("text-anchor",function(d){
  //     return ((d.endAngle - d.startAngle)/2 + d.startAngle) > Math.PI ? "end" : null;
  //   })
  //   .text(function(d){
  //     return leagues[d.index];
  //   });


  // Text Path.
  group.append("text")
    .attr("x",6)
    .attr("dy",15)
      .style("font", "40px")
    .append("textPath")
    .style("fill","black")

    .attr("xlink:href", function(d){
      return "#path"+d.index;
    })
    .text(function(d){
      console.log(d);
      return d.value > 20000 ? leagues[d.index] : "";
    });

  //Tick.
  var groupTick = group.selectAll(".group-tick")
      .data(function(d){
        return groupTicks(d,2e3*len);
      })
      .enter().append("g")
      .attr("class", "group-tick")
      .attr("transform", function(d){
        return "rotate(" + (d.angle*180/Math.PI - 90) + ") translate(" + outerRadius + ",0)";});

  groupTick.append("line")
    .attr("x2",6);

  groupTick
    .filter(function(d){
      console.log(len);
      return d.value % 2e4 == 0;
    })
    .append("text")
    .attr("x",8)
    .attr("dy",".35em")
    .attr("transform", function(d){
      return d.angle > Math.PI ? "rotate(180) translate(-16)" : null;
    })
    .style("text-anchor", function(d){
      return d.angle > Math.PI ? "end" : null;
    })
    .text(function(d){
      return d.value/1000;//formatValue(d.value);
    });

  /*
    ToolTip.
   */
  tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('se')
    .offset(function(){
      return [-200,0];
    })
    .html(function(d){
      var html = "";
      html += "<h2>"+leagues[d.source.index]+" to "+leagues[d.target.index]+"</h2></li>";
      html += "<h2>"+d.source.value/1000+" players</h2>";
      html += "<h2>"+leagues[d.target.index]+" to "+leagues[d.source.index]+"</h2>";
      html += "<h2>"+d.target.value/1000+" players</h2>";

      return html;
    });

  g.append("g")
    .attr("class", "ribbons")
    .selectAll("path")
    .data(function(chords){
      return chords;
    })
    .enter().append("path")
    .attr("d", ribbon)
    .style("fill", function(d){
      return utils.color(d.target.index);
    })
    .style("stroke", function(d){
      return d3.rgb(utils.color(d.target.index)).darker();
    });

  function groupTicks(d, step){
    var k = (d.endAngle - d.startAngle) / d.value;
    return d3.range(0, d.value, step).map(function(value){
      return {value: value, angle: value*k + d.startAngle};
    });
  }

  /*
    ribbons interaction.
  */

  d3.selectAll(".ribbons").selectAll("path")
    .on("mouseover", selectRobbin)
    .on("mouseout", clearRobbin);
  d3.selectAll(".ribbons").call(tip);

  d3.selectAll(".groups").selectAll("g")
    .on("click", function () {
        var thisGroup = d3.select(this);
        if(chordSelectedSet.has(thisGroup.datum().index)){
            chordSelectedSet.delete(thisGroup.datum().index);
        }else{
            chordSelectedSet.add(thisGroup.datum().index);
        }
        teams(chordSelectedSet, true);
    });

};
var chordSelectedSet = new Set();
function teams(selectedLeagues, updateExternal){
    d3.selectAll(".groups").selectAll("g")
        .classed('selected', function (d, i) {
           return selectedLeagues.has(d3.select(this).datum().index);
        });
    chordSelectedSet = selectedLeagues;

  selectRobbin(undefined, undefined, undefined, selectedLeagues);
  if (updateExternal) {
      forceDirect.selectLeague(undefined, selectedLeagues);
      leagueSelectionBar.selectLeague(selectedLeagues);
  }
}
var cache;
function selectRobbin(d, _, _, leagues) {
    if (!leagues) {
        var ribbon = d3.select(this);
        var ribbons = d3.select(".ribbons").selectAll("path").filter(function (d) {
            return true;
        });
        ribbons.transition().duration(600)
            .style("opacity", 0.1);
        ribbon.transition().duration(600)
            .style("opacity", 1.0);
        tip.show(d);
    } else {
        cache = leagues;
      var ribbons = d3.select(".ribbons").selectAll("path");
        ribbons.transition().duration(600)
            .style("opacity", function (d) {
                return leagues.size == 0 || leagues.has(d.target.index) || leagues.has(d.source.index) ? 1.0 : 0.1;
            });
    }
}

function clearRobbin(d) {

    tip.hide(d);
    if (cache && cache.size > 0) {
        selectRobbin(undefined, undefined, undefined, cache);
    } else {
        var ribbons = d3.select(".ribbons").selectAll("path");
        ribbons.transition().duration(600)
            .style("opacity", 1.0);
    }
}

function updateYears(yearList){
  forceDirect.loadYears(yearList, leagues);
  leagueSelectionBar.reset();
  loadYears(yearList, function (transferMatrix) {
    buildChord(transferMatrix, yearList.length);
  });
}

function loadYears(yearList, fn) {
    var transferMatrix = [];
    leagues.forEach(function(d){
        transferMatrix.push([0,0,0,0,0,0,0,0,0,0,0]);
    });

    var count = {value: 0};
    var max = {value:0};
    yearList.forEach(function(year){
        d3.csv("../../data/transfer"+year+".csv", function(error,csvData){
            csvData.forEach(function(d,i){
                var item = [];
                for(k in d){
                    item.push(d[k]*1000);
                }
                transferMatrix[i] = transferMatrix[i].sumArray(item);
            });
            count.value++;
            if(count.value == yearList.length) {
                fn(transferMatrix);
            }
        });
    });
}

function setUpBrush(years, svg, svgWidth, svgHeight){

  var brush = d3.brushX()
      .extent([[-1,0],[svgWidth+1,40]]).on("end", brushed);

  svg.append("g").attr("class","brushYear").call(brush);

  function brushed(){
    var selection = d3.event.selection;
    // var sb = self.svg.selectAll("rect");
    var list = [];
    for(var i=0; i<years.length; i++){
      if(selection != null && yearScale(i+0.5) >= selection[0] && yearScale(i+0.6) <= selection[1]){
        list.push(years[i]);
      }
    }

    if(list.length!=0){
      updateYears(list);
      svg.selectAll("circle").classed('selected', function (d) {
        return list.find(function (year) {
          return d == year;
        })
      });
    }
  }
}

function clearBrush(svg){
    svg.select("g.brushYear rect.selection")
        .attr('width', 0);
}


Array.prototype.sumArray = function (arr){
    var sum = [];
    if (arr != null && this.length == arr.length) {
        for (var i = 0; i < arr.length; i++) {
            sum.push(this[i] + arr[i]);
        }
    }

    return sum;
};
