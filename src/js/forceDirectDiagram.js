

function buildForceDirect(leagues, matrix, teams, teamTransfers, teamNames) {
    //leagues.map(function (d) {
    //    return {'id': d}
    //})

    var svg = d3.select("#force-direct-svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(teamTransfers)
        .enter().append("line")
        .attr("stroke-width", function(d) { return d.value * 5; })
        .style("stroke", function(d) { return utils.color(d.d.group); });

    var node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(teams)
        .enter().append("circle")
        .attr("r", function (d) { return d.value + 4; })
        .attr("fill", function(d) { return utils.color(d.group); })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
    node.append("title")
        .text(function(d) { return d.name + ': ' + d.value + ' players transferred in ' + d.league; });

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) {
            return d.id;
        }))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
    simulation.nodes(teams)
        .on("tick", ticked);

    simulation.force("link")
        .links(teamTransfers);

    function ticked() {
        link.attr("x1", function(d) {
            return d.source.x;
        }).attr("y1", function(d) {
            return d.source.y;
        }).attr("x2", function(d) {
            return d.target.x;
        }).attr("y2", function(d) {
            return d.target.y;
        });

        node.attr("cx", function(d) {
            return d.x;
        }).attr("cy", function(d) {
            return d.y;
        });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
var cacheleagues;
function selectLeague(league, leagues) {
    var svg = d3.select("#force-direct-svg");

    if (!leagues) {
        svg.select(".nodes")
            .selectAll("circle")
            .classed("selected", function (d) {
                return league && d.group == league
            })
            .classed("not-selected", function (d) {
                return league && d.group != league
            })
            .transition().duration(800)
            .attr("r", function (d) {
                return d.value + (league && d.group == league ? 8 : 4);
            });

        svg.select(".links")
            .selectAll("line")
            .classed("selected", function (d) {
                return league && d.d.group == league
            })
            .classed("not-selected", function (d) {
                return league && d.d.group != league
            })
            .transition().duration(600)
            .attr("stroke-width", function (d) {
                return d.value * (league && d.d.group == league ? 8 : 5);
            });
    } else if (leagues) {
        if (leagues.size == 0) {
            cacheleagues = null;
        } else {
            cacheleagues = leagues;
        }
        svg.select(".nodes")
            .selectAll("circle")
            .classed("selected", function (d) {
                return cacheleagues && cacheleagues.has(d.group)
            })
            .classed("not-selected", function (d) {
                return cacheleagues && !cacheleagues.has(d.group)
            })
            .transition().duration(800)
            .attr("r", function (d) {
                return d.value + (cacheleagues && cacheleagues.has(d.group) ? 8 : 4);
            });

        svg.select(".links")
            .selectAll("line")
            .classed("selected", function (d) {
                return cacheleagues && cacheleagues.has(d.d.group)
            })
            .classed("not-selected", function (d) {
                return cacheleagues && !cacheleagues.has(d.d.group)
            })
            .transition().duration(600)
            .attr("stroke-width", function (d) {
                return d.value * (cacheleagues && cacheleagues.has(d.d.group) ? 8 : 5);
            });
    }
}
