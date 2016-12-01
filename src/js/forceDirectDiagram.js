function ForceDirect() {
    var svg = d3.select("#force-direct-svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    svg.append("g")
        .attr("class", "links");

    svg.append("g")
        .attr("class", "nodes");

    this.simulation = d3.forceSimulation()
        .force("link", d3.forceLink()
            .id(function(d) {
            return d.teamIndex;
        })
            //.strength(function(d){ return d.value/20; })
        )
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));
}
ForceDirect.prototype.loadYears = function (years) {
    var me = this;
    var teamsM, teamTransfersM, teamNameToIndexM;
    var count = {value: 0};
    years.forEach(function(year) {
        me.loadYear(year, null, function (teams, teamTransfers, teamNameToIndex) {
            if (!teamsM) {
                teamsM = teams;
                teamTransfersM = teamTransfers;
                teamNameToIndexM = teamNameToIndex;
            } else {
                teamsM.forEach(function (team, index) {
                    team.transferOutValue += teams[index].transferOutValue;
                    team.transferInValue += teams[index].transferInValue;
                    team.value += teams[index].value;
                });

                teamTransfers.forEach(function (teamTransfer) {
                    var cache = teamTransfersM.find(function (d) {
                        return d.source == teamTransfer.source && d.target == teamTransfer.target;
                    });
                    if (cache) {
                        cache.value += teamTransfer.value;
                    } else {
                        teamTransfersM.push(teamTransfer);
                    }
                });
            }
            count.value++;
            if (count.value == years.length) {
                me.teams = teamsM;
                me.teamTransfers = teamTransfersM;
                me.teamNameToIndex = teamNameToIndexM;
                me.updateYear();
            }
        });
    });
}
ForceDirect.prototype.loadYear = function (year, transferMatrix, fn) {
    var me = this;
    d3.csv("../../data/team_transfer"+year+".csv", function(error, csvData){
        var teams = [],
            teamTransfers = [];
        var teamNameToIndex = {};
        csvData.columns.forEach(function(d, index){
            teams.push({
                name: d+"",
                transferOutValue: 0,
                transferInValue: 0,
                value: 0,
                teamIndex: index,
            });
            teamNameToIndex[d+""] = index;
        });

        csvData.forEach(function(d, index){
            for(k in d) {
                var value = parseInt(d[k]);
                if (value != 0) {
                    teamTransfers.push({
                        source: index,
                        sourceD: teams[index],
                        target: teamNameToIndex[k],
                        targetD: teams[teamNameToIndex[k]],
                        value: value,
                    });
                    teams[index].transferOutValue += value;
                    teams[index].value += value;
                    teams[teamNameToIndex[k]].transferInValue += value;
                    teams[teamNameToIndex[k]].value += value;
                }
            }
        });
        d3.csv("../../data/season2008.csv", function(error, csvData) {
            csvData.forEach(function(d){
                if (teamNameToIndex[d.team_long_name] && !teams[teamNameToIndex[d.team_long_name]].leagueIndex) {
                    teams[teamNameToIndex[d.team_long_name]].leagueIndex = leagues.findIndex(function (v) {
                        return v == d.league;
                    });
                }
            });
            //var deleted = {D:0};
            //teams.forEach(function (d, index) {
            //    if (d.leagueIndex!=null) {
            //
            //    } else {
            //        deleted.D++;
            //    }
            //});
            if (fn) {
                fn(teams, teamTransfers, teamNameToIndex);
            } else {
                me.teams = teams;
                me.teamTransfers = teamTransfers;
                me.teamNameToIndex = teamNameToIndex;
                me.updateYear(transferMatrix);
            }
        });
    });
}
ForceDirect.prototype.updateYear = function(matrix, showName) {
    if (!showName) {
        this.deselectNode();
    }
    var svg = d3.select("#force-direct-svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        me = this;

    this.simulation.nodes(me.teams);

    this.simulation.force("link")
        .links(me.teamTransfers);

    this.simulation.alpha(1);
    this.simulation.alphaTarget(0);

    var teamsMax = d3.max(me.teams, function (d) {return d.value});
    var teamsMin = d3.min(me.teams, function (d) {return d.value});
    var teamTransfersMax = d3.max(me.teamTransfers, function (d) {return d.value});
    var teamTransfersMin = d3.min(me.teamTransfers, function (d) {return d.value});
    me.teamScala = d3.scaleLinear()
        .domain([teamsMin, teamsMax])
        .range([10, 25]);

    me.teamTransferScala = d3.scaleLinear()
        .domain([teamTransfersMin, teamTransfersMax])
        .range([3, 17]);

    var link = svg.select(".links").selectAll("line").data(me.teamTransfers);
    var newLink = link.enter().append("line");
    link.exit().remove();
    link = newLink.merge(link);

    link.attr("stroke-width", function(d) { return me.teamTransferScala(d.value); })
        .style("stroke", function(d) { return utils.color(d.sourceD.leagueIndex); });

    var node = svg.select(".nodes").selectAll("circle").data(me.teams);
    var newNode = node.enter().append("circle");
    newNode.call(d3.drag()
            .on("start", me.dragstarted.bind(me))
            .on("drag", me.dragged.bind(me))
            .on("end", me.dragended.bind(me)));
    newNode.on("click", me.selectNode.bind(me));
    newNode.append("title");

    node.exit().remove();
    node = newNode.merge(node);

    node.attr("r", function (d) {
        return me.teamScala(d.value);
    }).attr("fill", function(d) { return utils.color(d.leagueIndex); });

    node.select("title")
        .text(function(d) { return d.name + ': ' + d.value + ' players transferred in ' + leagues[d.leagueIndex]; });

    var valueText = svg.select(".nodes").selectAll("text.valueTag").data(me.teams);
    var newValueText = valueText.enter().append("text")
        .classed('valueTag', true);
    newValueText.call(d3.drag()
        .on("start", me.dragstarted.bind(me))
        .on("drag", me.dragged.bind(me))
        .on("end", me.dragended.bind(me)));
    newValueText.on("click", me.selectNode.bind(me));
    valueText.exit().remove();
    valueText = newValueText.merge(valueText);
    valueText.html(function(d) { return showName || d.value > 3 ? d.value : ""; });

    var text = svg.select(".nodes").selectAll("text.nameTag").data(me.teams);
    var newText = text.enter().append("text")
        .classed('nameTag', true);

    text.exit().remove();
    text = newText.merge(text);
    text.html(function(d) { return showName && d.name; });

    this.simulation.on("tick", ticked);

    function ticked() {
        svg.select(".links").selectAll("line").attr("x1", function(d) {
            return d.source.x;
        }).attr("y1", function(d) {
            return d.source.y;
        }).attr("x2", function(d) {
            return d.target.x;
        }).attr("y2", function(d) {
            return d.target.y;
        });

        svg.select(".nodes").selectAll("circle").attr("cx", function(d) {
            return d.x;
        }).attr("cy", function(d) {
            return d.y;
        });

        svg.select(".nodes").selectAll("text.valueTag").attr("x", function(d) {
            return d.x;
        }).attr('y', function (d) {
            return d.y + 4;
        });

        if (showName) {
            svg.select(".nodes").selectAll("text.nameTag").attr("x", function(d) {
                return d.x;
            }).attr('y', function (d) {
                return d.y - me.teamScala(d.value) - 4;
            });
        }
    }
}
ForceDirect.prototype.dragstarted = function(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0.35).restart();
    d.fx = d.x;
    d.fy = d.y;
}

ForceDirect.prototype.dragged = function(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

ForceDirect.prototype.dragended = function(d) {
    if (!d3.event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

var cacheleagues;
ForceDirect.prototype.selectLeague = function (league, leagues) {
    var svg = d3.select("#force-direct-svg"),
        me = this;

    if (!leagues) {
        svg.select(".nodes")
            .selectAll("circle")
            .classed("selected", function (d) {
                return league && d.leagueIndex == league
            })
            .classed("not-selected", function (d) {
                return league && d.leagueIndex != league
            })
            .transition().duration(800)
            .attr("r", function (d) {
                return me.teamScala(d.value) + (league && d.leagueIndex == league ? 5 : 0);
            });

        svg.select(".links")
            .selectAll("line")
            .classed("selected", function (d) {
                return league && d.sourceD.leagueIndex == league
            })
            .classed("not-selected", function (d) {
                return league && d.sourceD.leagueIndex != league
            })
            .transition().duration(600)
            .attr("stroke-width", function (d) {
                return me.teamTransferScala(d.value) + (league && d.sourceD.leagueIndex == league ? 5 : 0);
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
                return cacheleagues && cacheleagues.has(d.leagueIndex)
            })
            .classed("not-selected", function (d) {
                return cacheleagues && !cacheleagues.has(d.leagueIndex)
            })
            .transition().duration(800)
            .attr("r", function (d) {
                return me.teamScala(d.value) + (cacheleagues && cacheleagues.has(d.leagueIndex) ? 5 : 0);
            });

        svg.select(".links")
            .selectAll("line")
            .classed("selected", function (d) {
                return cacheleagues && cacheleagues.has(d.sourceD.leagueIndex)
            })
            .classed("not-selected", function (d) {
                return cacheleagues && !cacheleagues.has(d.sourceD.leagueIndex)
            })
            .transition().duration(600)
            .attr("stroke-width", function (d) {
                return me.teamTransferScala(d.value) + (cacheleagues && cacheleagues.has(d.sourceD.leagueIndex) ? 5 : 0);
            });
    }
}

ForceDirect.prototype.selectNode = function (d) {
    var me = this;

    if (!this.selectMode) {
        me.teamsC = me.teams;
        me.teamTransfersC = me.teamTransfers;
    }

    me.teamTransfers = me.teamTransfersC.filter(function (teamTransfer) {
        return  teamTransfer.sourceD.teamIndex == d.teamIndex|| teamTransfer.targetD.teamIndex == d.teamIndex;
    });

    //me.teamTransfers = me.teamTransfers.filter(function (teamTransfer) {
    //    return me.teamTransfers.find(function (teamTransfer2) {
    //        return teamTransfer.sourceD.teamIndex == teamTransfer2.targetD.teamIndex || teamTransfer.targetD.teamIndex == teamTransfer2.sourceD.teamIndex ||
    //        teamTransfer.sourceD.teamIndex == teamTransfer2.sourceD.teamIndex || teamTransfer.targetD.teamIndex == teamTransfer2.targetD.teamIndex;
    //    });
    //});

    me.teams = me.teamsC.filter(function (team) {
        return team.teamIndex == d.teamIndex || me.teamTransfers.find(function (teamTransfer) {
                return teamTransfer.sourceD.teamIndex == team.teamIndex|| teamTransfer.targetD.teamIndex == team.teamIndex;
            });
    })
    this.selectMode = true;
    //this.simulation.force("charge").distanceMax(1600);
    this.simulation.force("charge").strength(-4000);
    this.updateYear(null, true);
}

ForceDirect.prototype.deselectNode = function () {
    if (this.selectMode) {
        this.selectMode = false;
        this.teams = this.teamsC;
        this.teamTransfers = this.teamTransfersC;
        this.simulation.force("charge").strength(-30);
    }
}