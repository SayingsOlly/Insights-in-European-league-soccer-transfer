function ForceDirect() {
    var svg = d3.select("#force-direct-svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    svg.append("g")
        .attr("class", "links");

    svg.append("g")
        .attr("class", "nodes");

    this.forceManyBody = d3.forceManyBody();
    this.forceCenter = d3.forceCenter(width / 2, height / 2);
    this.forceLink = d3.forceLink()
        .id(function(d) {
            return d.teamIndex;
        });//.distance(190)//function(d){ return d.value/20; });
    this.simulation = d3.forceSimulation()
        .force("link", this.forceLink)
        .force("charge", this.forceManyBody)//.distanceMax(1000))
        .force("center", this.forceCenter);

    this.tooltip();
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

    //var teamTransferMatrix = [];
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
        //
        //teams.forEach(function(d){
        //    var tmp = [];
        //    teams.forEach(function(d){
        //        tmp.push(0);
        //    });
        //    teamTransferMatrix.push(tmp);
        //});

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
            //
            //var item = [];
            //for(k in d){
            //    item.push(d[k]*1000);
            //}
            //teamTransferMatrix[index] = teamTransferMatrix[index].sumArray(item);
        });
        d3.csv("../../data/season2008.csv", function(error, csvData) {
            csvData.forEach(function(d){
                if (teamNameToIndex[d.team_long_name] && !teams[teamNameToIndex[d.team_long_name]].leagueIndex) {
                    teams[teamNameToIndex[d.team_long_name]].leagueIndex = leagues.findIndex(function (v) {
                        return v == d.league;
                    });
                }
            });
            //teams = teams.filter(function (d, index) {
            //    return d.value != 0;
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
    newNode.on("click", me.selectNode.bind(me))
        .on('mouseover', function (d) {
            me.tip.show(d);
        })
        .on('mouseout', function (d) {
            me.tip.hide(d);
        });
    //newNode.append("title");

    node.exit().remove();
    node = newNode.merge(node);

    node.attr("r", function (d) {
        return me.teamScala(d.value);
    }).attr("fill", function(d) { return utils.color(d.leagueIndex); })
        .style('display', function (d) { return d.value == 0 ? 'none' : 'inherit'; });
    node.call(this.tip);

    //node.select("title")
        //.text(function(d) { return d.name + ': ' + d.value + ' players transferred in ' + leagues[d.leagueIndex]; });

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

    this.simulation.nodes(me.teams);

    this.simulation.force("link")
        .links(me.teamTransfers);

    this.simulation.alpha(1).restart();
    this.simulation.alphaTarget(0).restart();

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

ForceDirect.prototype.selectLeague = function (league, leagues) {
    var svg = d3.select("#force-direct-svg"),
        me = this;

    this.deselectNode();
    if (leagues.size == 0) {
        this.updateYear();
    } else {
        var names = new Set();
        me.teams.forEach(function (team) {
            if (leagues.has(team.leagueIndex))
                names.add(team.name);
        });
        this.selectNodes(names);
    }
}

ForceDirect.prototype.selectNode = function (d) {
    var nameSet = new Set();
    nameSet.add(d.name);
    this.selectNodes(nameSet);
    leagueSelectionBar.selectTeam(d.leagueIndex, d.name);
}

ForceDirect.prototype.selectNodes = function (teamNames) {
    var me = this;

    if (!this.selectMode) {
        me.teamsC = me.teams;
        me.teamTransfersC = me.teamTransfers;
    }

    me.teamTransfers = me.teamTransfersC.filter(function (teamTransfer) {
        return teamNames.has(teamTransfer.sourceD.name) || teamNames.has(teamTransfer.targetD.name);
    });

    me.teams = me.teamsC.filter(function (team) {
        return me.teamTransfers.find(function (teamTransfer) {
                return teamTransfer.sourceD.teamIndex == team.teamIndex|| teamTransfer.targetD.teamIndex == team.teamIndex;
            });
    })
    this.selectMode = true;
    //this.simulation.force('link').distance(190);
    if (me.teams.length > 4) {
        this.forceLink.distance(100);
        this.forceManyBody.strength(-30);
        this.forceCenter.strength(1);
    } else {
        this.forceLink.distance(Math.max(190 / me.teams.length, 100));
        this.forceManyBody.strength(-120);
        this.forceCenter.strength(1.5);
    }
    //this.simulation.force("charge").strength(-4000 / (teamNames.size * 2 - 1));
    this.updateYear(null, true);
}

ForceDirect.prototype.deselectNode = function () {
    if (this.selectMode) {
        this.selectMode = false;
        this.teams = this.teamsC;
        this.teamTransfers = this.teamTransfersC;
        //this.simulation.force('link').distance(30);
        this.forceLink.distance(30);
        this.forceManyBody.strength(-30);
        this.forceCenter.strength(1);
        //this.simulation.force("charge").strength(-30);
    }
}

ForceDirect.prototype.tooltip = function () {
    var me = this;
    this.tip = d3.tip()
        .attr('class', 'd3-tip')
        .direction('s')
        .offset(function(){
            return [100,0];//200,200];
        })
        .html(function(d) {
            var inArr = [], outArr = [], team = d;
            var tmp = me.teamTransfersC || me.teamTransfers;
            tmp.forEach(function (transfer) {
                if (transfer.source.teamIndex != transfer.target.teamIndex && transfer.source.teamIndex == d.teamIndex) {
                    outArr.push(transfer);
                } else if (transfer.source.teamIndex != transfer.target.teamIndex && transfer.target.teamIndex == d.teamIndex) {
                    inArr.push(transfer);
                }
            });

            /**
             * name: d+"",
             transferOutValue: 0,
             transferInValue: 0,
             value: 0,
             teamIndex: index,
             */

            inArr.sort(function (a, b) { return b.value-a.value;});
            outArr.sort(function (a, b) { return b.value-a.value;});
            inArr = inArr.splice(0, 5);
            outArr = outArr.splice(0, 5);
            var html = "";
            html += "<div style='padding-left: 4px; border-left: 12px solid "+utils.color(d.leagueIndex)+"'>"+ d.name+" "+ (team.transferInValue + team.transferOutValue)+" players transferred</div>";
            html += "<div style='padding-left: 4px; border-left: 12px solid "+utils.color(d.leagueIndex)+"'>League: "+ leagues[d.leagueIndex]+"</div>";
            html += "<div style='display: flex;'>";
            if (d.transferInValue != 0) {
                html += "<div style='padding: 15px;'>";
                html += "<div>" + d.transferInValue + " transferred into this team" + "</div>";
                inArr.forEach(function (d) {
                    html += "<div style='padding-left: 4px; border-left: 12px solid "+utils.color(d.targetD.leagueIndex)+"'>" + d.sourceD.name + ": " + d.value + " (" + parseInt(d.value / team.transferInValue * 100) + "%)</div>";
                });
                html += "</div>";
            }
            if (d.transferOutValue != 0) {
                html += "<div style='padding: 15px;'>";
                html += "<div>"+ d.transferOutValue +" transferred out of this team"+"</div>";
                outArr.forEach(function (d) {
                    html += "<div style='padding-left: 4px; border-left: 12px solid "+utils.color(d.targetD.leagueIndex)+"'>"+ d.targetD.name +": " + d.value + " ("+ parseInt(d.value/team.transferOutValue * 100) +"%)</div>";
                });
                html += "</div>";
            }
            html += "</div>";

            /**
             *   <div>Palermo 44 player trasnferred</div><div>(League: Italy Serie A)</div>
             <div style="
             display: flex;
             "><div style="
             padding: 15px;
             "><div>23 trasnfer out of this team</div><div>Fiorentina: 4 (20%)</div><div>Paris Saint-Germain: 2 (10%)</div><div>Atalanta: 1 (5%)</div><div>Sunderland: 1 (5%)</div><div>Bologna: 1 (5%)</div></div><div style="
             padding: 15px;
             ">
             <div>20 trasnfer into this team</div><div>Novara: 4 (20%)</div><div>Bologna: 2 (10%)</div><div>Bari: 2 (10%)</div><div>Napoli: 2 (10%)</div><div>Queens Park Rangers: 1 (5%)</div></div></div>
             */
            return html;
        });
}