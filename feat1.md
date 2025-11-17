# Importing credit card expenditure and visualizing it, classifying the expenses

Our first feature of Monetaire is going to be basic: we should be able to import credit card expenditure data for a given month and store that information, whilst also displaying it on the UI in an easy to reason about table. Expenses should be able to be sorted on this table by their various fields, most important of which being the actual prices. 

The input format is going to be the following for Nubank:

date,title,amount
2025-10-10,"IOF de ""Rch-Kagi.Com""",1.94
2025-10-10,Mp \*Wshpatinetes,10.27
2025-10-10,Rch-Kagi.Com,55.68
(and so on, amounts are in reais)

What I am interested in seeing in the UI is the following:
1. date charged
2. the "name" of the expense, more on this below
3. the actual title of the expense as seen in the input
4. whether this was a credit card expense, or a debit expense, or else, seen as a tag
5. the expense category, seen as tags
6. the value charged

I should also be able to enter manually expenses not in the credit card's charges, such as amounts I sent in PIX to other people. This should fall into the classification of the AI as well, mostly by the name of the expense. See terminology. 

## Terminology

The actual "name" of the expense is not the one that shows up in the input but rather the actual subject of the expense: for instance, when seeing an Amazon 8/10 expense, this means that it is on the 8th payment of a 10-payments sum, but this is not the actual name of the expense. I want to be able to add a name for a given expense when importing a month's expenses and it should save this name to the record. This is going to be important because it is going to remember the name and insert the same name when it sees Amazon 9/10 on the next month with the same value of the expense.

## Classification

Expenses should be classified according to the categories I can register as a user. Starting ones could be the following:
1. Food 
2. Travel
3. Library (i.e. books) 
4. Hobbies
5. Housing (think rent, maintenance)
6. Subscriptions
7. Other expenses (this is a catch-all for everything else but should only be used as a last resort)
8. And potentially some project-related ones, such as building a workstation, but those are for the future.

The classification happens as follows: upon reading the input, the service calls an LLM API, Ollama running locally in our case with API key "Ollama" with structured input and expects structured output containing the expense and the classification given to it. The input to the LLM should contain all the necessary information to classify an expense: the name, the title from the input, the expense value, and other useful information you might think of. 

### Learning

The classification service should allow for the LLM to "learn" from past predictions when encountering a new one. This can take two forms:

#### Recurring credit card expense

Recurring expenses are the ones tagged with the number of the current charge against the total number of charges. For instance:

2025-09-11,Amazon Marketplace - Parcela 2/3,33.39
2025-09-11,Ana Sabino Alves - Parcela 3/5,74.00
2025-09-11,Amazonmktplc*Grandcomm - Parcela 3/6,31.66*
 
The first expense here is a 3-months recurring one, currently in the second month, with 33.39 reais paid this month.

The strategy for classifying these expenses is simple: on the first month, they should be sent to the classification service. On the second, they should receive the same classification as the last month's expenses matching by <CurrentChargeMonth - 1, Charge Value>. The minus 1 is because this is a new month, and we match against the last month. This is a simple, deterministic rule and should not involve AI.

#### Generic Expenses

Other expenses, the ones not recurring, can be of various types. Our AI agent should be able to classify them from what it learned from past expenses. Say, for instance, that it does not know company A, but it has already an expense for company A which I manually tagged as Food; well, from now on it could classify company A's purchases as food or related. To this point we add a new requirement: for expenses, I should be able to classify some by hand if I disagree with the model's classifications, and this would be taken into account as having a higher weight for future classifications or if I decide to reclassify the current month.

THe actual rules here are:
1. If we recognize a vendor that sells things from multiple classifcations (looking at the past Expenses and their categories), we mark this vendor as "general", and upon seeing a charge from this vendor the AI model should look at the name of the expense and the value and the name of the company only in terms of classification, not on the reclassification history for the company.
2. If the vendor is not a general one, but the user has reclassified an expense from this company earlier on, this learning can be made simple for now: we have a reclassification history table related to the expenses one by expense ID and month, where manual classifications are tied to expenses and this is also given to the AI model. Upon seeing a company name, we look up the reclassification history for that company and if there is a reclassification, that new category now has a higher weight than others. For future classifications, the company's charges should be categorized as this newer category. 


### Summary of learning and technical specification

Given the above, we do the following: 
1. Deterministic rule-based matching for the company name without more than one category and on different recurring expenses. Perform a lookup to see if this company has more than one category in the past. If it does not, assign this same category to the new expense if there is exactly one category in the past. If there are none, go to step 2. For recurring expenses, deterministic rules would mean matching against the past charge (current minus 1) of that same value using the tuple <current - 1, total amount of charges, value>.
2. Actual LLM-assisted matching on the cases where the expense company has never been categorized before or the company has more than one category listed. This should be based on date of purchase, name, title from the input, value, company if different than the title.

When deterministic rules did the trick, we do not send to the AI. More intelligent learning is not necessary right now using actual ML models and feature classification so no need to worry about that.

This is enough for the scope of this feature. Future work would involve turning this into a dashboard, but worry not about that. Focus on the table and classification.

Use beautiful icons in order to make the UI pop more but do not overdo it.

No need to handle different users and authentication now. Robust debug logging can be used for the classifications, both AI and deterministic.
