f = open("season2008.csv")

league = set()
for line in f:
	line = line.strip().split(',')
	league.add(line[-1])

league.remove("league")
league = list(league)

# for item in league:
# 	print item

########################################
item  = league[0]

team = set()
f = open("season2008.csv")
for line in f:
	line = line.strip().split(',')
	if item ==line[-1]:
		team.add(line[-2])

print item, len(team)
for item in team:
	print item

