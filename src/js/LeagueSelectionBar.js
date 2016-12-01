
function LeagueSelectionBar(teamSelectionBar, forceDirect) {
    var me = this;
    this.selectedLeagues = new Set();

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
        if (me.selectedLeagues.size == 0) {
            me.leagues.classed('not-selected', false);
        } else {
            me.leagues.classed('not-selected', function () {
                return !me.selectedLeagues.has(d3.select(this).attr('name'));
            });
        }
        teamSelectionBar.showLeagues(me.selectedLeagues);
        var indexSet = new Set();
        me.selectedLeagues.forEach(function (league) {
            indexSet.add(leagues.findIndex(function (d) {
                return d == league;
            }));
        });
        selectRobbin(undefined, undefined, undefined, indexSet);
    })
}