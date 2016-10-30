import sqlite3
import csv

class SqliteReader():
    def __init__ (self, dbName):
        self.conn = sqlite3.connect(dbName)

    def read(self):
        outputList = []
        outputDict = dict()
        for i in range(1,11):
            cursor = self.conn.execute("SELECT player_name, match.id, season, team_long_name, League.name FROM Match JOIN Player ON home_player_"+str(i)+" = player_api_id JOIN Team on home_team_api_id = team_api_id JOIN League on league.id = league_id and season = '2008/2009'")
            #print (cursor)
            for row in cursor:
                outputDict[row[0]] = row[1:]

#        print (outputDict)
        self.writeFile(self.reformated(outputDict))

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

        with open('season2008.csv', 'w') as csvfile:
            fieldnames = ['player_name', 'season', 'team_long_name', 'league']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for item in resultList:
                writer.writerow(item)

if __name__ == '__main__':
    lite = SqliteReader("database v2-2.sqlite")
    lite.read()
