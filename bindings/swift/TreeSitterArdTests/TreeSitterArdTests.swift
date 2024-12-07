import XCTest
import SwiftTreeSitter
import TreeSitterArd

final class TreeSitterArdTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ard())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Ard grammar")
    }
}
