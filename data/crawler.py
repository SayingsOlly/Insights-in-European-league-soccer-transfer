from bs4 import BeautifulSoup
#from unidecode import unicodestring
import json
import csv
import requests
from SqliteReader import SqliteReader
from difflib import SequenceMatcher

leagues = ["premier-league/transfers/wettbewerb/GB1/", "laliga/transfers/wettbewerb/ES1/","jumplist/transfers/wettbewerb/NL1/", "jumplist/transfers/wettbewerb/SC1/", "jumplist/transfers/wettbewerb/PL1/", "jumplist/transfers/wettbewerb/BE1/", "jumplist/transfers/wettbewerb/C1/", "jumplist/transfers/wettbewerb/PO1/", "jumplist/transfers/wettbewerb/FR1/", "jumplist/transfers/wettbewerb/IT1/", "jumplist/transfers/wettbewerb/L1/"]

leaguesName = ["England Premier League", "Spain LIGA BBVA","Netherlands Eredivisie", "Scotland Premier League", "Poland Ekstraklasa", "Belgium Jupiler League", "Switzerland Super League", "Portugal Liga ZON Sagres", "France Ligue 1", "Italy Serie A", "Germany 1. Bundesliga"]

confidential_teamNames = set()
confidential_teamList = []
candidate_teamNames = set()
candidate_players = set()
db_teamNames = []

leagueTeamDict = dict()

tmDict = {"Spurs":"Tottenham Hotspur", "AFC Ajax":"Ajax Amsterdam" ,"Rennes":"Stade Rennais FC"}

db_tmDict = {"Ajax Amsterdam":"Ajax"}

getridofList = ["Kairat Almaty", "Banska Bystrica","Sparta Praha"]
def crawl(league, year):

    leagueList = []
    r = requests.get("http://www.transfermarkt.co.uk/"+league+"saison_id/"+year, allow_redirects=False, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
    })

    soup = BeautifulSoup(r.content, "html.parser")

    for content in soup.find_all("div", class_="table-header"):
        leagueDict = dict()
        for a in content.find_all("a"):
            if a.text != "":
                leagueDict["Team"] = a.text
                #confidential_teamNames.append(a.text)
                print "---------",a.text, "------------"

        tables = content.parent.find_all("div", class_="responsive-table")

        subDict = dict()
        subList = []
        for table in tables:
            tbody = table.tbody
            if tbody != None:
                for tr in tbody.find_all("tr"):
                    fee = tr.find("td", class_="no-border-links verein-flagge-transfer-cell").findNextSibling("td").find("a").text

                    if(fee!= "?" and fee!= "-" and fee != "End of loan" and "Loan" not in fee and fee != "End of career"):
                        subDict = dict()
                        subDict["From"] = tr.find("td", class_="no-border-links verein-flagge-transfer-cell").find("a").text
                        print "from:", subDict["From"]
                        subDict["Fee"] = fee.replace(u'\xa3',"")
                        print "fee:", subDict["Fee"]
                        subDict["Player"] = tr.find("a", class_="spielprofil_tooltip").text
                        subList.append(subDict)
                        print "player:", subDict["Player"]
                        print "------------------"
            break

        leagueDict["Transfers"] = subList
        leagueList.append(leagueDict)

    return leagueList

def crawl_formated(i,league, year):

    print league
    print "-----------------"
    leagueTeamList = []
    leagueList = []
    r = requests.get("http://www.transfermarkt.co.uk/"+league+"saison_id/"+year, allow_redirects=False, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
    })

    soup = BeautifulSoup(r.content, "html.parser")

    for content in soup.find_all("div", class_="table-header"):
        leagueDict = dict()
        for a in content.find_all("a"):
            if a.text != "":
                leagueDict["Team"] = a.text
                confidential_teamNames.add(a.text)
                confidential_teamList.append(a.text)
                leagueTeamList.append(a.text)
                print "---------",a.text, "------------"

        tables = content.parent.find_all("div", class_="responsive-table")

        subDict = dict()
        subList = []
        for table in tables:
            tbody = table.tbody
            if tbody != None:
                for tr in tbody.find_all("tr"):
                    fee = tr.find("td", class_="no-border-links verein-flagge-transfer-cell").findNextSibling("td").find("a").text
                    transfer_from = tr.find("td", class_="no-border-links verein-flagge-transfer-cell").find("a").text

                    if(fee != "" and fee!= "?" and fee!= "-" and fee != "End of loan" and "Loan" not in fee and fee != "End of career" and "U21" not in transfer_from and "U19" not in transfer_from and "U23" not in transfer_from and transfer_from not in getridofList):
                        subDict = dict()
                        # team
                        candidate_teamNames.add(transfer_from)
                        subDict["From"] = transfer_from

                        # make fee to float.
                        fee = fee.replace(u'\xa3',"")
                        if fee == "Free transfer":
                            fee = 0
                        elif fee[-1] == 'k':
                            fee = float(fee[0:-1])*0.001
                        elif fee[-1] == 'm':
                            fee = float(fee[0:-1])
                        else:
                            fee = 0
                        subDict["Fee"] = fee
                        print fee
                        # player
                        subDict["Player"] = tr.find("a", class_="spielprofil_tooltip").text
                        candidate_players.add(subDict["Player"])

                        subList.append(subDict)
                        #print "player:", subDict["Player"]
                        #print "------------------"
            break

        leagueDict["Transfers"] = subList
        leagueList.append(leagueDict)
    leagueTeamDict[leaguesName[i]] = leagueTeamList
    return leagueList

def crawlForYear(year):
    final_result = {}
    yearList = []
    for i,league in enumerate(leagues):
        yearDict = dict()
        yearDict["League"] = leaguesName[i]
        yearDict["Teams"] = crawl_formated(i,league, year)
        yearList.append(yearDict)


    # --------------------------------------
    findConfidentialTeam()

    for yearItem in yearList:
        for teamItem in yearItem["Teams"]:
            if "Team" in teamItem.keys():
                final_result[teamItem["Team"]] = dict()
                tmpDict = dict()
                for titem in teamItem["Transfers"]:
                    if titem["From"] in tmDict.keys():
                        if tmDict[titem["From"]] not in tmpDict.keys():
                            tmpDict[tmDict[titem["From"]]] = titem["Fee"]
                        else:
                            tmpDict[tmDict[titem["From"]]] = tmpDict[tmDict[titem["From"]]] + titem["Fee"]
                final_result[teamItem["Team"]] = tmpDict

    #print final_result

    final_list = []
    indexDict = dict()
    for i,teamName in enumerate(confidential_teamList):
        indexDict[teamName] = i
        #confidential_teamList[i] = teamName.encode('utf-8')

    #print indexDict

    for teamName in confidential_teamList:
        tmpList = [0.0]*len(confidential_teamList)
        if len(final_result[teamName]) !=0:
            for k,v in final_result[teamName].items():
                tmpList[indexDict[k]] += v
        final_list.append(tmpList)

    buildLeagueData(final_result)
    match_web_db()
    #print final_list
    # transform to database formate.
    for i,teamName in enumerate(confidential_teamList):
        if teamName in db_tmDict.keys():
            confidential_teamList[i] = db_tmDict[teamName].encode("utf8")

    outputList = []
    for row in final_list:
        tmpDict = dict()
        for i,item in enumerate(row):
            tmpDict[confidential_teamList[i]] = item
        outputList.append(tmpDict)

    #print outputList
    with open("2013-2014_team_transfer_fee.csv", 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=confidential_teamList)
        writer.writeheader()
        for item in outputList:
            writer.writerow(item)
    # print confidential_teamNames
    # print "------------------"
    # print candidate_teamNames
    # print "------------------"
    # print candidate_players
    #print yearList

    # with open('2013TransferFee.json', 'w') as outfile:
    #     json.dump(yearList, outfile, sort_keys=True, indent=4, separators=(',', ': '))

def similar(a, b):
    return SequenceMatcher(None, a, b).ratio()

def findConfidentialTeam():

    def getKey(item):
        return item[1]

    candiDict = dict()
    for candi in candidate_teamNames:
        candiList = []
        for confidence in confidential_teamNames:
            ratio = similar(candi, confidence)
            candiList.append((confidence, ratio))
        candiList.sort(key=getKey, reverse = True)
        candiDict[candi] = candiList


    generate_match(candiDict)

def generate_match(candiDict):
    matchDict = dict()
    for k,v in candiDict.items():
        matchDict[k] = v[0]

    team_filter(matchDict)

def team_filter(matchDict):

    def getKey(item):
        return item[1]

    filtered_dict = dict()
    for item in confidential_teamNames:
        filtered_dict[item] = (u'default', 0.0)

    for k,v in matchDict.items():
        if(v[1] > 0.5 and v[1] > filtered_dict[v[0]][1]):
            filtered_dict[v[0]] = (k,v[1])

    #print filtered_dict

    for k,v in filtered_dict.items():
        if(v[0] not in tmDict.keys()):
            tmDict[v[0]] = k

    #print tmDict

def match_web_db():

    def getKey(item):
        return item[1]

    matchDict = dict()
    for confi in confidential_teamNames:
        matchList = []
        for dbName in db_teamNames:
            ratio = similar(confi, dbName)
            matchList.append((dbName, ratio))
        matchList.sort(key=getKey, reverse = True)
        matchDict[confi] = matchList[0]

    filtered_dict = dict()
    for item in db_teamNames:
        filtered_dict[item] = (u'default', 0.0)

    for k,v in matchDict.items():
        if(v[1] > 0.5 and v[1] > filtered_dict[v[0]][1]):
            filtered_dict[v[0]] = (k,v[1])

    #print filtered_dict

    for k,v in filtered_dict.items():
        if(v[0] not in db_tmDict.keys()):
            db_tmDict[v[0]] = k

    print "db_tmDict:",db_tmDict

def buildLeagueData(final_result):
    print "------------comming-----------"

    leagueTransferResult = dict()
    print "len:",len(leagueTeamDict)
    for k,v in leagueTeamDict.items():
        tmpDict = dict()
        for k2,v2 in leagueTeamDict.items():
            tmpDict[k2] = 0.0
            for fk, fv in final_result.items():
                for name, fee in fv.items():
                    if (fk in v) and (name in v2):
                        tmpDict[k2] += fee

        leagueTransferResult[k] = tmpDict

    print leagueTransferResult

    leagueTransferList = []

    for item in leaguesName:
        leagueTransferList.append(leagueTransferResult[item])

    with open("2013-2014_league_transfer_fee.csv", 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=leaguesName)
        writer.writeheader()
        for item in leagueTransferList:
            writer.writerow(item)

root = "http://www.transfermarkt.co.uk/"
years = ["2008", "2009", "2010", "2011", "2012", "2013"]

sqlReader = SqliteReader("database v2-2.sqlite")
sqlReader.readTeam()
db_teamNames = sqlReader.teams

crawlForYear("2013")

print len(db_teamNames)
#match_web_db()

#print leagueTeamDict
#utf8string = unicodestring.encode("utf-8")
