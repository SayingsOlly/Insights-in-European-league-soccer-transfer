var utils = {};
var leagues = [];
var years = ["2008-2009","2009-2010", '2010-2011', '2011-2012', '2012-2013', '2013-2014'];
var forceDirect, leagueSelectionBar, teamSelectionBar, yearTrendDiagram, teamDetailDiagram;

window.onload = function () {
    forceDirect = new ForceDirect();
    yearTrendDiagram = new YearTrendDiagram();
    teamDetailDiagram = new TeamDetailDiagram();

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

        //  utils.color = d3.scaleOrdinal()
        // .domain(d3.range(11))
        // .range(["#FFEB3B ", "#00FFFF", "#EF5350", "#CCFF66", "#F48FB1", "#CE93D8", "#8D6E63", "#A26229", "#5C6BC0", "#1ABC9C", "##F5B041"]);

 
      utils.color = d3.scaleOrdinal()
        .domain(d3.range(11))
        .range(["#87CEFA",  "  #FFB2FF","#20B2AA", "#9370DB",  " #4682B4", "#9ACD32", "#FF5959","#7FFFD4", "#BC8F8F",  "#6670AD", "#E78271"]);

      // utils.color = d3.scaleOrdinal()
      //   .domain(d3.range(11))
      //   .range(["#87CEFA",  "  #FFB2FF","#20B2AA", "#9370DB",  " #4682B4", "#9ACD32", "#FF5959","#7FFFD4", "#BC8F8F",  "#6670AD", "#E78271"]);

      // utils.color = d3.scaleOrdinal()
      //   .domain(d3.range(11))
      //   .range(["#234928", "#AFDD89", "#957244", "#F26223", "#011227", "#C34222", "#F11223", "#A26229", "#807652", "#640928", "#E78271"]);

    // utils.color = d3.scaleOrdinal()
    //     .domain(d3.range(11))
    //     .range(["#7FFFD4", "#FFE1FF", "#FFFF97", "#FFB2B2", "#F0C2FF", "#CCB299", "#94C7FF", "#D9FF82", " #FFD65C", "#FFC9FF", "#8CD1A3"]);

}
