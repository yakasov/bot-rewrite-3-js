"use strict";

const fs = require("fs");
const path = require("path");
const readline = require("readline");

function readFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      readFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

async function findFunctionDefinitions(filePath) {
  const functions = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    "crlfDelay": Infinity,
    "input": fileStream
  });

  const functionRegex = /"(?<funcName>\w+)":\s*\((?<args>.*?)\)\s*=>/u;

  for await (const line of rl) {
    const match = line.match(functionRegex);
    if (match) {
      const functionName = match[1];
      functions.push({ "file": filePath,
        "name": functionName });
    }
  }

  return functions;
}

async function findDuplicateFunctions(dir) {
  const allFiles = readFilesRecursively(dir);
  const functionOccurrences = {};

  for (const file of allFiles) {
    if (file.endsWith(".js")) {
      const functions = await findFunctionDefinitions(file);
      functions.forEach((fn) => {
        if (!functionOccurrences[fn.name]) {
          functionOccurrences[fn.name] = [];
        }
        functionOccurrences[fn.name].push(fn.file);
      });
    }
  }

  const duplicates = {};
  for (const [
    name,
    files
  ] of Object.entries(functionOccurrences)) {
    if (files.length > 1) {
      duplicates[name] = files;
    }
  }

  return duplicates;
}

const directoryPath = ".";
findDuplicateFunctions(directoryPath)
  .then((duplicates) => {
    console.log("Duplicate functions found:");
    for (const [
      name,
      files
    ] of Object.entries(duplicates)) {
      console.log(`Function "${name}" is defined in:`);
      files.forEach((file) => {
        console.log(`  - ${file}`);
      });
    }
  })
  .catch((err) => {
    console.error(err);
  });
