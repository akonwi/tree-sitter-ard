;; Keywords
"if" @keyword.control.conditional
"else" @keyword.control.conditional
"while" @keyword.control.repeat
"for" @keyword.control.repeat
"in" @keyword.control.repeat
(break) @keyword.control.break
"match" @keyword.control.conditional
"let" @keyword.storage
"mut" @keyword.storage.modifier
"use" @keyword.import
"fn" @keyword.function
"struct" @keyword.storage.type
"enum" @keyword.storage.type
"impl" @keyword.storage.type
"type" @keyword.storage.type
(and) @keyword.operator.logical
(or) @keyword.operator.logical
(not) @keyword.operator.logical

// imports
(module_path) @link.text

;; Basic types
(primitive_type) @type.builtin
(generic_type) @type.builtin
(result_type) @type.builtin
(list_type) @type.builtin
(map_type) @type.builtin

;; Identifiers
(identifier) @variable
(function_definition name: (identifier) @function)
(function_call target: (identifier) @function.call)
(struct_definition name: (identifier) @type)
(enum_definition name: (identifier) @type)
(param_def name: (identifier) @variable.parameter)
(anonymous_parameter name: (identifier) @variable.parameter)

;; Attributes
(struct_property name: (identifier) @property)
(struct_prop_pair name: (identifier) @property)
(member_access member: (identifier) @property)

;; Values
(string) @string
(escape_sequence) @string.escape
(number) @number
(boolean) @constant.builtin.boolean

;; Operators
(assign) @operator.assignment
(increment) @operator.assignment
(decrement) @operator.assignment
(plus) @operator
(minus) @operator
(multiply) @operator
(divide) @operator
(modulo) @operator
(equal) @operator
(not_equal) @operator
(less_than) @operator
(greater_than) @operator
(less_than_or_equal) @operator
(greater_than_or_equal) @operator
(inclusive_range) @operator
"=>" @operator

;; Punctuation
"(" @punctuation.bracket
")" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"<" @punctuation.bracket
">" @punctuation.bracket
"," @punctuation.delimiter
(period) @punctuation.delimiter
":" @punctuation.delimiter
(double_colon) @punctuation.delimiter
";" @punctuation.delimiter
"?" @punctuation.special
"$" @punctuation.special
(wildcard) @punctuation.special

;; Comments
(comment) @comment
