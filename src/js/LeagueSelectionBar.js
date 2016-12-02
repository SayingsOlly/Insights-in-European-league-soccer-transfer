
function LeagueSelectionBar(teamSelectionBar, forceDirect) {
    var me = this;
    this.selectedLeagues = new Set();

    this.teamSelectionBar = teamSelectionBar;
    this.leagues = d3.select('#leagues-selections').selectAll('div');
    this.leagues.style('border-bottom', function () {
        var league = d3.select(this).attr('name');
        return '8px solid ' + utils.color(leagues.findIndex(function (d) {
                return d == league;
            }));
    }).on('click', function (){
        var league = d3.select(this);
        if (me.selectedLeagues.has(league.attr('name'))) {
            me.selectedLeagues.delete(league.attr('name'));
        } else {
            me.selectedLeagues.add(league.attr('name'));
        }
        me.updateLeague(true, true);
    })
}

LeagueSelectionBar.prototype.selectLeague = function (leaguesIndex) {
    var me = this;
    this.selectedLeagues = new Set();
    leaguesIndex.forEach(function (leagueIndex) {
        me.selectedLeagues.add(leagues[leagueIndex]);
    });
    this.updateLeague();
}

LeagueSelectionBar.prototype.selectTeam = function (leagueIndex, teamName) {
    var me = this;
    this.selectedLeagues = new Set();
    me.selectedLeagues.add(leagues[leagueIndex]);
    this.updateLeague(true);
    this.teamSelectionBar.selectTeam(teamName);
}

LeagueSelectionBar.prototype.updateLeague = function (downward, downwardForce) {
    var me= this;
    if (me.selectedLeagues.size == 0) {
        me.leagues.classed('not-selected', false);
    } else {
        me.leagues.classed('not-selected', function () {
            return !me.selectedLeagues.has(d3.select(this).attr('name'));
        });
    }
    teamSelectionBar.showLeagues(me.selectedLeagues);

    if (downward) {
        var indexSet = new Set();
        me.selectedLeagues.forEach(function (league) {
            indexSet.add(leagues.findIndex(function (d) {
                return d == league;
            }));
        });
        selectRobbin(undefined, undefined, undefined, indexSet);
        downwardForce && forceDirect.selectLeague(null, indexSet);
    }
}