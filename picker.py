import json
import random

words = []
usedWordIndices = set()
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
            usedWordIndices.add(index)

with open("pool.json", "r") as f:
    pool = json.load(f)
    usedWordIndices.update(pool)

with open("solution.json", "r") as f:
    solution = json.load(f)
    for item in solution:
        index = item.get("index")
        if index is not None:
            usedWordIndices.add(index)

with open("rejected.json") as f:
    rejected = json.load(f)
    rejectedWordIndices.update(rejected)

availableWordIndices = [i for i in range(
    len(words)) if i not in usedWordIndices and i not in rejectedWordIndices]
random.shuffle(availableWordIndices)
print("Available words: ", len(availableWordIndices))

poolAdditions = []
i = 0
while i < len(availableWordIndices):
    wordIndex = availableWordIndices[i]
    print(words[wordIndex])

    # Undo previous operation if it is a redo. Otherwise this has no effect.
    if wordIndex in poolAdditions:
        poolAdditions.remove(wordIndex)
    if wordIndex in rejectedWordIndices:
        rejectedWordIndices.remove(wordIndex)
    
    quit = False
    while True:
        c = input("Verdict: ")
        if c == "a":
            poolAdditions.append(wordIndex)
            break
        elif c == "":
            rejectedWordIndices.add(wordIndex)
            break
        elif c == "r":
            i -= 2 # 2 instead of 1 to compensate for the increment at the end
            break
        elif c.startswith("c "):
            customWord = c[2:]
            if customWord not in words:
                print(customWord, "not in the dictionary")
            else:
                customWordIndex = words.index(customWord)
                if customWordIndex in poolAdditions:
                    print(customWord, "is already scheduled for addition")
                elif customWordIndex in usedWordIndices:
                    print(customWord, "has been used in the past")
                else:
                    if customWordIndex in rejectedWordIndices:
                        rejectedWordIndices.remove(customWordIndex)
                    if customWordIndex in availableWordIndices:
                        availableWordIndices.remove(customWordIndex)
                    poolAdditions.append(customWordIndex)
                    break
        elif c == "q":
            quit = True
            break
    i += 1
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
