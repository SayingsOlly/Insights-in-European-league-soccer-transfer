var utils = {};
var leagues = [];
var years = ["2008-2009","2009-2010", '2010-2011', '2011-2012', '2012-2013', '2013-2014'];

window.onload = function () {

    d3.csv("../../data/transfer2008-2009.csv", function(error, csvData){
        var transferMatrix = [];
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
      setUp(leagues, transferMatrix);
      yearChart();
      buildChord(transferMatrix);

      d3.csv("../../data/team_transfer2008-2009.csv", function(error, csvData){
        var teams = [], teamTransfers = [];
        var i = 0;
        csvData.forEach(function(d){
          for(k in d){
            if(i==0){
              teams.push({name:k+"", value: 0});
            }
          }
          i++;
        });

        var teamNames = {};
            //teams.sort(function (a,b) {return a.name > b.name ? 1 : (a.name < b.name ? -1 : 0);});

            teams.forEach(function (d, index) {
                teamNames[d.name] = d;
                d.index = index;
                d.id = index;
            });

            var index = {index:0};
            csvData.forEach(function(d){
                index.index++;
                var i = 0;
                for(k in d) {
                    var value = parseInt(d[k]);
                    if (value != 0) {
                        teamTransfers.push({
                            source: teams[index.index].index,
                            target: teamNames[k].index,
                            value: value,
                            d: teamNames[k],
                            sourceD: teams[index.index]
                        });
                        teams[index.index].value += value;
                        //if (teamNames[k].index == index.index)
                        //    console.log('hi');
                    }

                    i++;
                }
            });
            d3.csv("../../data/season2008.csv", function(error, csvData) {
                var index = {index:0};
                var league = {};
                csvData.forEach(function(d){
                    if (!league[d.league]) {
                        league[d.league] = {index: index.index};
                        index.index++;
                    }
                    teamNames[d.team_long_name].league = d.league;
                    teamNames[d.team_long_name].group = leagues.findIndex(function (v) {
                        return v == d.league;
                    });
                });
                buildForceDirect(leagues, transferMatrix, teams, teamTransfers, teamNames);
            });
        });
    });
};

function setUp(leagues, matrix) {
    /*
     Color scale.
     */
    utils.color = d3.scaleOrdinal()
        .domain(d3.range(11))
        .range(["#234928", "#AFDD89", "#957244", "#F26223", "#011227", "#C34222", "#F11223", "#A26229", "#807652", "#640928", "#E78271"]);
}
