#!/bin/bash

node input-party.js input david@brown.edu 1
node input-party.js input henry@brown.edu 2
node input-party.js input weili@brown.edu 3
node input-party.js input delete1@brown.edu 4
node input-party.js input delete2@brown.edu 5
node input-party.js input haha@brown.edu 6

node input-party.js delete delete1@brown.edu
node input-party.js delete delete2@brown.edu
