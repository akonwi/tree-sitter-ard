package tree_sitter_ard_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ard "github.com/akonwi/tree-sitter-ard/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ard.Language())
	if language == nil {
		t.Errorf("Error loading Ard grammar")
	}
}
