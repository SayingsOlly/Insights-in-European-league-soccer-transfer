d3.csv("../../data/transfer2008-2009.csv", function(error, csvData){
  buildChord(csvData);
});

function buildChord(csvData){
  //Data matrix
  var transferMatrix = [];
  var leagues = [];

  var i = 0;
  csvData.forEach(function(d){
    var item = [];
    for(k in d){
      if(i==0){
      leagues.push(k+"");
      }

      item.push(d[k]*1000);
    }
    i++;
    transferMatrix.push(item);
  });

  console.log(leagues);
  var matrix = transferMatrix;

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

  /*
    Color scale.
   */
  var color = d3.scaleOrdinal()
      .domain(d3.range(11))
      .range(["#234928", "#AFDD89", "#957244", "#F26223", "#011227", "#C34222", "#F11223", "#A26229", "#807652", "#640928", "#E78271"]);

  var g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
      .datum(chord(matrix));

  var group = g.append("g")
      .attr("class", "groups")
      .selectAll("g")
      .data(function(chords){
        return chords.groups;
      })
      .enter()
      .append("g");

  group.append("path")
    .style("fill", function(d){
      console.log(d.index);
      return color(d.index);
    })
    .style("stroke", function(d){
      return d3.rgb(color(d.index)).darker();
    })
    .attr("d", arc);

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
      return color(d.target.index);
    })
    .style("stroke", function(d){
      return d3.rgb(color(d.target.index)).darker();
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
    .on("mouseover",function(d){
      var ribbon = d3.select(this);
      var ribbons = d3.select(".ribbons").selectAll("path");
      ribbons.style("opacity", 0.3);
      ribbon.style("opacity", 1.0);
      console.log(ribbon.datum());
      tip.show(d);
    })
    .on("mouseout", function(d){
      var ribbons = d3.select(".ribbons").selectAll("path");
      ribbons.style("opacity", 1.0);
      tip.hide(d);
    });
  d3.selectAll(".ribbons").call(tip);

  var selectedSet = new Set();

  d3.selectAll(".groups").selectAll("g")
    .on("click", function(d){
      var thisGroup = d3.select(this);
      if(thisGroup.attr("class") == "selected"){
        thisGroup.attr("class", "");
        selectedSet.delete(leagues[thisGroup.datum().index]);
      }else{
        thisGroup.attr("class", "selected");
        selectedSet.add(leagues[thisGroup.datum().index]);
      }
      teams(selectedSet);
    });

};


function teams(selectedLeagues){
  console.log(selectedLeagues);
}
