function yearChart(years, leagues){

  var yearChart = d3.select("#year-chart");

  svgWidth = yearChart.node().getBoundingClientRect().width;
  svgHeight = 100;

  console.log(svgWidth);
  var svg = d3.select("#year-chart").append("svg")
      .attr("width",svgWidth)
      .attr("height",svgHeight);

  console.log(years);
  //scale
  var yearScale = d3.scaleLinear()
      .range([0,svgWidth]).domain([0,years.length]);

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

  svg.append("path")
    .attr("class", "lineCharts")
    .attr("stroke","grey")
    .style("stroke-dasharray", ("3,3"))
    .style("z-index", "0")
    .attr("d", "M 0 20 L " + self.svgWidth + " 20");


  yearCircle.on("click", function(d,i){
    var circle = d3.select(this);
    console.log("aaaa");
    if(circle.attr("class") != "highlighted"){
      yearCircle.attr("class", "year-circle");
      circle.attr("class","highlighted");
    }

    d3.csv("../../data/transfer"+circle.datum()+".csv", function(error,csvData){
      var transferMatrix = [];

      csvData.forEach(function(d){
            var item = [];
            for(k in d){
                item.push(d[k]*1000);
            }
            i++;
            transferMatrix.push(item);
        });
      buildChord(leagues, transferMatrix);
    });
  });

}

function buildChord(leagues, matrix){
  // get the svg.
  var svg = d3.select("#chordSVG");

  // initiate.
  var width = +svg.attr("width");

  var height = +svg.attr("height");

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

  // var g = svg.selectAll(".chordGroup")
  //     .data(chord(matrix));

  // var gEnter = g.enter().append("g");
  // g.exit().remove();
  // g = gEnter.merge(g);

  // g.attr("class","chordGroup")
  //   .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  var group = g.append("g")
      .attr("class", "groups")
      .selectAll("g")
      .data(function(chords){
        return chords.groups;
      })
      .enter()
      .append("g").attr("class","group");

  // var group = g.selectAll(".groups")
  //     .data(function(chords){
  //       return chords.groups;
  //     });

  // var groupEnter = group.enter().append("g");
  // group.exit().remove();
  // group = groupEnter.merge(group);

  // group.attr("class","groups")
  //   .enter().append("g").attr("class","group");

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
        return groupTicks(d,2e3);
      })
      .enter().append("g")
      .attr("class", "group-tick")
      .attr("transform", function(d){
        return "rotate(" + (d.angle*180/Math.PI - 90) + ") translate(" + outerRadius + ",0)";});

  groupTick.append("line")
    .attr("x2",6);

  groupTick
    .filter(function(d){
      return d.value % 5e3 == 0;
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

  var selectedSet = new Set();

  d3.selectAll(".groups").selectAll("g")
    .on("click", function(d){
      var thisGroup = d3.select(this);
      if(thisGroup.attr("class") == "selected"){
        thisGroup.attr("class", "");
        selectedSet.delete(thisGroup.datum().index);
      }else{
        thisGroup.attr("class", "selected");
        selectedSet.add(thisGroup.datum().index);
      }
      teams(selectedSet);
    });

};


function teams(selectedLeagues){
  console.log(selectedLeagues);
  selectRobbin(undefined, undefined, undefined, selectedLeagues);
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
        selectLeague(d.target.index);
    } else {
        cache = leagues;
      var ribbons = d3.select(".ribbons").selectAll("path");
        ribbons.transition().duration(600)
            .style("opacity", function (d) {
                return leagues.size == 0 || leagues.has(d.target.index) || leagues.has(d.source.index) ? 1.0 : 0.1;
            });
        selectLeague(undefined, leagues);
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
        selectLeague(null, cache);
    }
}

function update(year){

};
