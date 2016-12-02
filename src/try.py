f = open("../data/season2008.csv")


league = set()
for line in f:
	line = line.strip().split(',')
	league.add(line[-1])


league = list(league)
league.pop(0)
# print league

###########################################
# c = 0
# for item in league:
# 	s = set()
# 	f = open("../data/season2008.csv")
# 	for line in f:
# 		line = line.strip().split(',')
# 		if line[-1] == item:
# 			s.add(line[2])
# 	c+=len(s)
# 	print item, len(s)


# print c
###########################################

item = league[9]
s = set()
f = open("../data/season2008.csv")
for line in f:
	line = line.strip().split(',')
	if line[-1] == item:
		s.add(line[-2])
print item, len(s)
for item in s:
	print item

