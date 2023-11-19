import json
import random

words = []
unavailableWordIndices = set()
rejectedWordIndices = set()

with open("words.js", "r") as f:
    s = f.read()
    s = s[s.find("["):s.rfind(",")] + "]"
    words = json.loads(s)

with open("history.json", "r") as f:
    history = json.load(f)
    for item in history:
        index = item.get("index")
        if index is not None:
            unavailableWordIndices.add(index)

with open("pool.json", "r") as f:
    pool = json.load(f)
    unavailableWordIndices.update(pool)

with open("solution.json", "r") as f:
    solution = json.load(f)
    for item in solution:
        index = item.get("index")
        if index is not None:
            unavailableWordIndices.add(index)

with open("rejected.json") as f:
    rejected = json.load(f)
    rejectedWordIndices.update(rejected)

unavailableWordIndices.update(rejectedWordIndices)

availableWordIndices = [i for i in range(
    len(words)) if i not in unavailableWordIndices]
random.shuffle(availableWordIndices)

poolAdditions = []
for index in availableWordIndices:
    print(words[index])
    quit = False
    while True:
        c = input("Verdict: ")
        if c == "a":
            poolAdditions.append(index)
            break
        elif c == "":
            rejectedWordIndices.add(index)
            break
        elif c == "q":
            quit = True
            break
    if quit:
        break

reviewed = False
while not reviewed:
    print("\n=====================================\n")
    print("Review additions: ")
    for i in range(len(poolAdditions)):
        index = poolAdditions[i]
        p = "X" if index in rejectedWordIndices else i
        print(p, ": ", words[index])

    amendment = input("Amendment: ")
    if amendment == "":
        reviewed = True
    elif amendment.isdecimal():
        ai = int(amendment)
        rejectedWordIndices.add(poolAdditions[ai])
    else:
        try:
            index = words.index(amendment)
            rejectedWordIndices.discard(index)
            poolAdditions.append(index)
        except:
            print("Invalid input")
            continue

pool.extend([i for i in poolAdditions if i not in rejectedWordIndices])
with open("pool.json", "w") as f:
    json.dump(pool, f, indent=2)

orderedRejected = sorted(rejectedWordIndices)
with open("rejected.json", "w") as f:
    json.dump(orderedRejected, f, indent=2)
