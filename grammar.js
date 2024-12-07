/**
 * @file Ard grammar for tree-sitter
 * @author Akonwi Ngoh
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "ard",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
