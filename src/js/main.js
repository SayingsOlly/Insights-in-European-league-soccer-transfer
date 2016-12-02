var utils = {};
var leagues = [];
var years = ["2008","2009", '2010', '2011', '2012', '2013'];
var forceDirect, leagueSelectionBar, teamSelectionBar, yearTrendDiagram, teamDetailDiagram;

window.onload = function () {
    forceDirect = new ForceDirect();

    d3.csv("../../data/2013_league_transfer_fee.csv", function(error, csvData){
        var transferMatrix = [];
        var i = 0;
        csvData.forEach(function(d){
            var item = [];
            for(k in d){
                if(i==0){
                  leagues.push(k+"");
                  console.log("ad");
                  console.log(k);
                }

                item.push(d[k]*1000);
            }
            i++;
            transferMatrix.push(item);
        });

      setUp(leagues, transferMatrix);
      yearTrendDiagram = new YearTrendDiagram();
      teamDetailDiagram = new TeamDetailDiagram();
      teamSelectionBar = new TeamSelectionBar(forceDirect);
      leagueSelectionBar = new LeagueSelectionBar(teamSelectionBar, forceDirect);
      yearChart();
      buildChord(transferMatrix);
      forceDirect.loadYear("2008-2009", transferMatrix);
    });
};

function setUp(leagues, matrix) {
    /*
     Color scale.
     */
    utils.color = d3.scaleOrdinal()
        .domain(d3.range(11))
        .range(["#1f78b4","#cab2d6","#b2df8a", "#33a02c",  "#fb9a99", "#e31a1c", "#fdbf6f","#ff7f00","#6a3d9a","#a6cee3", "#ffff99"]);
}
