/**
 * @file Ard grammar for tree-sitter (minimal bootstrap)
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  assign: 1,
  range: 2,
  or: 3,
  and: 4,
  compare: 5,
  add: 6,
  multiply: 7,
  unary: 8,
  call: 9,
  member: 10,
  type_result: 11,
};

const sep1 = (rule, sep) => seq(rule, repeat(seq(sep, rule)));

module.exports = grammar({
  name: "ard",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  supertypes: ($) => [$.statement, $.expression, $.type],

  conflicts: ($) => [
    [$.primary_expression, $.struct_literal],
    [$.while_loop, $.primary_expression],
    [$.block, $.match_expression],
    [$.primary_expression, $.match_case],
    [$.trait_method],
    [$.postfix],
  ],

  precedences: ($) => [
    [$.for_in_loop, $.struct_literal],
  ],

  rules: {
    source_file: ($) => repeat(choice($.import_statement, $.statement)),

    comment: ($) => token(seq("//", /[^\n]*/)),

    identifier: ($) => /[A-Za-z_$][A-Za-z0-9_]*/,
    module_path: ($) => /[A-Za-z0-9_][A-Za-z0-9_\/\.-]*/,

    number: ($) => /[0-9][0-9_]*(\.[0-9_]+)?/,
    string: ($) =>
      seq(
        '"',
        repeat(choice($.string_content, $.escape_sequence, $.string_interpolation)),
        '"'
      ),
    string_content: ($) => token.immediate(/[^"\\{]+/),
    escape_sequence: ($) => token.immediate(seq("\\", /./)),
    rune: ($) => token(seq("'", repeat(choice(/[^'\\\n]/, seq("\\", /./))), "'")),
    boolean: ($) => choice("true", "false"),
    void: ($) => prec(-1, seq("(", ")")),

    import_statement: ($) =>
      seq(
        "use",
        field("path", $.module_path),
        optional(seq("as", field("alias", $.identifier)))
      ),

    statement: ($) =>
      choice(
        $.variable_declaration,
        $.function_declaration,
        $.extern_function,
        $.struct_declaration,
        $.enum_declaration,
        $.trait_declaration,
        $.impl_block,
        $.if_statement,
        $.while_loop,
        prec.dynamic(1, $.for_in_loop),
        $.for_loop,
        $.break_statement,
        $.expression_statement
      ),

    expression_statement: ($) => $.expression,

    break_statement: ($) => "break",

    variable_declaration: ($) =>
      seq(
        choice("let", "mut"),
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression)
      ),

    function_declaration: ($) =>
      seq(
        optional(choice("private", "test")),
        "fn",
        field("name", choice($.qualified_identifier, $.identifier)),
        optional(field("type_params", $.type_parameters)),
        field("parameters", $.parameter_list),
        optional(field("return_type", $.type)),
        field("body", $.block)
      ),

    extern_function: ($) =>
      seq(
        optional("private"),
        "extern",
        "fn",
        field("name", $.identifier),
        optional(field("type_params", $.type_parameters)),
        field("parameters", $.parameter_list),
        optional(field("return_type", $.type)),
        "=",
        field("binding", $.string)
      ),

    anonymous_function: ($) =>
      seq(
        "fn",
        optional(field("type_params", $.type_parameters)),
        field("parameters", $.parameter_list),
        optional(field("return_type", $.type)),
        field("body", $.block)
      ),

    parameter_list: ($) =>
      seq("(", optional(sep1($.parameter, ",")), ")"),

    parameter: ($) =>
      seq(optional("mut"), field("name", $.identifier), optional(seq(":", field("type", $.type)))),

    type_parameters: ($) =>
      seq("<", sep1($.type_parameter, ","), ">"),

    type_parameter: ($) => $.identifier,

    struct_declaration: ($) =>
      seq(
        optional("private"),
        "struct",
        field("name", $.identifier),
        optional(field("type_params", $.type_parameters)),
        field("body", $.struct_body)
      ),

    struct_body: ($) =>
      seq("{", repeat(seq($.struct_field, optional(","))), "}"),

    struct_field: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    enum_declaration: ($) =>
      seq(
        optional("private"),
        "enum",
        field("name", $.identifier),
        "{",
        optional(sep1($.enum_variant, ",")),
        optional(","),
        "}"
      ),

    enum_variant: ($) =>
      seq(field("name", $.identifier), optional(seq("=", field("value", $.expression)))),

    trait_declaration: ($) =>
      seq(
        optional("private"),
        "trait",
        field("name", $.identifier),
        "{",
        repeat($.trait_method),
        "}"
      ),

    trait_method: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        optional(field("return_type", $.type))
      ),

    impl_block: ($) =>
      seq(
        "impl",
        field("target", choice($.qualified_identifier, $.identifier)),
        optional(seq("for", field("for_type", $.identifier))),
        optional(seq("as", field("receiver", $.identifier))),
        field("body", $.impl_body)
      ),

    impl_body: ($) => seq("{", repeat($.function_declaration), "}"),

    if_statement: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        field("consequence", $.block),
        optional(seq("else", field("alternative", choice($.if_statement, $.block))))
      ),

    while_loop: ($) =>
      seq(
        "while",
        choice(field("body", $.block), seq(field("condition", $.expression), field("body", $.block)))
      ),

    for_in_loop: ($) =>
      seq(
        "for",
        field("bindings", sep1($.for_binding, ",")),
        "in",
        field("iterable", $.expression),
        field("body", $.block)
      ),

    for_binding: ($) => choice($.identifier, $.wildcard),

    for_loop: ($) =>
      seq(
        "for",
        optional(choice("let", "mut")),
        field("init", $.for_init),
        ";",
        field("condition", $.expression),
        ";",
        field("increment", $.expression),
        field("body", $.block)
      ),

    for_init: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq(":", field("type", $.type))),
        "=",
        field("value", $.expression)
      ),

    block: ($) => seq("{", repeat($.statement), "}"),

    expression: ($) => $.assignment_expression,

    assignment_expression: ($) =>
      choice(
        prec.right(
          PREC.assign,
          seq($.range_expression, choice("=", "=+", "=-"), $.assignment_expression)
        ),
        $.range_expression
      ),

    range_expression: ($) =>
      choice(
        prec.left(PREC.range, seq($.or_expression, "..", $.or_expression)),
        $.or_expression
      ),

    or_expression: ($) =>
      choice(
        prec.left(PREC.or, seq($.and_expression, "or", $.or_expression)),
        $.and_expression
      ),

    and_expression: ($) =>
      choice(
        prec.left(PREC.and, seq($.comparison_expression, "and", $.and_expression)),
        $.comparison_expression
      ),

    comparison_expression: ($) =>
      choice(
        prec.left(
          PREC.compare,
          seq(
            $.additive_expression,
            choice("<", "<=", ">", ">=", "==", "!="),
            $.additive_expression
          )
        ),
        $.additive_expression
      ),

    additive_expression: ($) =>
      choice(
        prec.left(PREC.add, seq($.multiplicative_expression, choice("+", "-"), $.additive_expression)),
        $.multiplicative_expression
      ),

    multiplicative_expression: ($) =>
      choice(
        prec.left(PREC.multiply, seq($.unary_expression, choice("*", "/", "%"), $.multiplicative_expression)),
        $.unary_expression
      ),

    unary_expression: ($) =>
      choice(
        prec(PREC.unary, seq(choice("-", "not"), $.unary_expression)),
        $.try_expression,
        $.postfix_expression,
        $.primary_expression
      ),

    postfix_expression: ($) =>
      prec.right(
        PREC.call,
        seq($.primary_expression, repeat1($.postfix))
      ),

    postfix: ($) =>
      choice(
        $.argument_list,
        $.generic_suffix,
        prec.right(seq(".", $.identifier, $.argument_list)),
        seq(".", $.identifier)
      ),

    argument_list: ($) => seq("(", optional(sep1($.argument, ",")), ")"),

    argument: ($) =>
      seq(
        optional("mut"),
        choice($.named_argument, $.expression)
      ),

    named_argument: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    primary_expression: ($) =>
      choice(
        $.number,
        $.string,
        $.rune,
        $.boolean,
        $.void,
        $.self_expression,
        $.identifier,
        $.qualified_identifier,
        $.list_literal,
        $.map_literal,
        $.struct_literal,
        $.block,
        $.parenthesized_expression,
        $.anonymous_function,
        $.match_expression
      ),

    parenthesized_expression: ($) => prec(-1, seq("(", $.expression, ")")),

    self_expression: ($) => "self",
    string_interpolation: ($) =>
      seq("{", field("expression", $.expression), "}"),

    list_literal: ($) => seq("[", optional(sep1($.expression, ",")), optional(","), "]"),

    map_literal: ($) =>
      seq(
        "[",
        choice(
          seq(":", "]"),
          seq(sep1($.map_entry, ","), optional(","), "]")
        )
      ),

    map_entry: ($) => seq(field("key", $.expression), ":", field("value", $.expression)),

    struct_literal: ($) =>
      seq(
        field("name", choice($.qualified_identifier, $.identifier)),
        field("body", $.struct_literal_body)
      ),

    struct_literal_body: ($) =>
      seq("{", optional(sep1($.struct_literal_field, ",")), optional(","), "}"),

    struct_literal_field: ($) =>
      seq(field("name", $.identifier), ":", field("value", $.expression)),

    match_expression: ($) =>
      seq(
        "match",
        optional(field("subject", $.expression)),
        "{",
        repeat($.match_case),
        "}"
      ),

    match_case: ($) =>
      seq(
        field("pattern", choice($.expression, $.wildcard)),
        "=>",
        field("body", choice($.block, $.expression)),
        optional(",")
      ),

    wildcard: ($) => "_",

    try_expression: ($) =>
      seq(
        "try",
        field("expression", $.postfix_expression),
        optional($.catch_clause)
      ),

    catch_clause: ($) =>
      prec.right(
        seq(
          "->",
          field("target", choice($.qualified_identifier, $.identifier, $.wildcard)),
          optional(field("body", $.block))
        )
      ),

    qualified_identifier: ($) =>
      prec.left(seq($.identifier, repeat1(seq("::", $.identifier)))),

    type: ($) => choice($.result_type, $.nullable_type),

    result_type: ($) =>
      prec.right(PREC.type_result, seq($._type_primary, "!", $.type)),

    nullable_type: ($) => prec.right(seq($._type_primary, optional("?"))),

    _type_primary: ($) =>
      choice(
        $.primitive_type,
        $.mutable_type,
        $.function_type,
        $.list_type,
        $.map_type,
        $.generic_type,
        $.qualified_identifier,
        $.identifier
      ),

    primitive_type: ($) => choice("Int", "Float", "Str", "Bool", "Void"),

    mutable_type: ($) => seq("mut", field("inner", $.type)),

    generic_type: ($) =>
      seq(choice($.qualified_identifier, $.identifier), field("type_args", $.type_arguments)),

    type_arguments: ($) => seq("<", sep1($.type, ","), ">"),

    // Minimal generic call suffix for expressions (avoids '<' vs comparison ambiguity).
    generic_suffix: ($) => token(seq("<", /[^>\\n]+/, ">")),

    list_type: ($) => seq("[", field("element", $.type), "]"),

    map_type: ($) =>
      seq("[", field("key", $.type), ":", field("value", $.type), "]"),

    function_type: ($) =>
      seq("fn", "(", optional(sep1($.type, ",")), ")", field("return", $.type)),
  },
});
