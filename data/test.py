import sys
stringA = "universit\xe9".decode('cp1252')
print stringA
stringA = unicode(stringA.decode('utf8'),errors='replace')
stringA = u'\n'+stringA
print stringA
