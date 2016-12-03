import sqlite3
import csv

class SqliteReader():
    def __init__ (self, dbName):
        self.conn = sqlite3.connect(dbName)
        self.league = ["England Premier League","Germany 1. Bundesliga", "Switzerland Super League", "Netherlands Eredivisie", "France Ligue 1", "Scotland Premier League", "Portugal Liga ZON Sagres", "Poland Ekstraklasa", "Italy Serie A", "Spain LIGA BBVA", "Belgium Jupiler League"]
        self.teams = []

    def readTeam(self):
        cursor = self.conn.execute("SELECT team_long_name FROM Team")
        for row in cursor:
            self.teams.append(row[0])

        print (self.teams)

    def read(self, year):
        outputDict = dict()
        for i in range(1,11):
            cursor = self.conn.execute("SELECT player_name, match.id, season, team_long_name, League.name FROM Match JOIN Player ON home_player_"+str(i)+" = player_api_id JOIN Team on home_team_api_id = team_api_id JOIN League on league.id = league_id and season = '"+year+"'")

            for row in cursor:
                outputDict[row[0]] = row[1:]

        return self.reformated(outputDict)
        #self.writeFile(self.reformated(outputDict))

    def process(self):

        self.readTeam()
        list1 = self.read("2014/2015")
        list2 = self.read("2015/2016")

        filterList = []

        for item1 in list1:
            for item2 in list2:
                if((item1["player_name"] == item2["player_name"]) and (item1["team_long_name"] != item2["team_long_name"])):
                    filterList.append(item1)

        #print (len(list1))
        #print (len(filterList))
        #print (filterList)
        #transfer between league
        transferList = []
        for i in range(len(self.league)):
            sets = set()
            for item in filterList:
                if( item["league"] == self.league[i]):
                    sets.add(item["player_name"])
            tmpList = []
            for j in range(len(self.league)):
                count = 0
                for item in list2:
                    if( item["league"] == self.league[j]):
                        if item["player_name"] in sets:
                            print (item["player_name"])
                            count += 1
                tmpList.append(count)
            transferList.append(tmpList)

        self.writeFile_transform(self.reformated_transfer(transferList, self.league), 'transfer2014-2015.csv', self.league)
        # between teams

        teamTransferList = []
        for i in range(len(self.teams)):
            sets = set()
            for item in filterList:
                if (item["team_long_name"] == self.teams[i]):
                    sets.add(item["player_name"])
            print (sets)
            tmpList = []
            for j in range(len(self.teams)):
                count = 0
                for item in list2:
                    if (item["team_long_name"] == self.teams[j]):
                        if item["player_name"] in sets:
                            print ("count+1")
                            count+=1
                tmpList.append(count)
            teamTransferList.append(tmpList)

        # writefile
        self.writeFile_transform(self.reformated_transfer(teamTransferList,self.teams), "team_transfer2013-2014.csv",self.teams)

    def reformated_transfer(self, transferList, fieldList):
        formatedList = []
        for item in transferList:
            tmpDict = dict()
            for i in range(len(fieldList)):
                tmpDict[fieldList[i]] = item[i]
            formatedList.append(tmpDict)

        return formatedList

    def writeFile_transform(self, transferList, outputFilename, fieldnames):


        with open(outputFilename, 'w') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for item in transferList:
                writer.writerow(item)


    def reformated(self, outputList):
        formatedList = []

        for k,v in outputList.items():
            tmpDict = dict()
            tmpDict["player_name"] = k
            tmpDict["season"] = v[1]
            tmpDict["team_long_name"] = v[2]
            tmpDict["league"] = v[3]
            formatedList.append(tmpDict)

        return formatedList

    def writeFile(self, resultList):

        def team_name(s):
            return s["team_long_name"]

        resultList = sorted(resultList, key = team_name)

        with open('season2009.csv', 'w') as csvfile:
            fieldnames = ['player_name', 'season', 'team_long_name', 'league']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for item in resultList:
                writer.writerow(item)

if __name__ == '__main__':
    lite = SqliteReader("database v2-2.sqlite")
    lite.process()
