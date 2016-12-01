
function TeamSelectionBar() {
    var me = this;
    this.selectedTeams = new Set();
    this.leagues = d3.select('#teams-selections').selectAll('div.view');
    this.leagues.style('border-bottom', function () {
       return '4px solid' + utils.color(d3.select(this).attr('id').slice(5).replace(/-/gm, ' '));
    });
    this.images = this.leagues.selectAll('img');
    this.images.on('click', function () {
        var team = d3.select(this);
        me.images.classed('not-selected', true);
        team.classed('not-selected', false);

        if (me.selectedTeams.has(team.attr('name'))) {
            me.selectedTeams.delete(team.attr('name'));
        } else {
            me.selectedTeams.add(team.attr('name'));
        }
        if (me.selectedTeams.size == 0) {
            me.images.classed('not-selected', false);
        } else {
            me.images.classed('not-selected', function () {
                return !me.selectedTeams.has(d3.select(this).attr('name'));
            });
        }
    });
}

TeamSelectionBar.prototype.showLeagues = function (leagues) {
    this.selectedTeams = new Set();
    this.images.classed('not-selected', false);
    this.leagues.classed('selected', function () {
        return leagues.has(d3.select(this).attr('id').slice(5).replace(/-/gm, ' '));
    });
}