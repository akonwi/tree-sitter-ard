import Foundation
import XCTest
import SwiftTreeSitter
import TreeSitterArd

final class TreeSitterArdTests: XCTestCase {
    private static let sample = """
    use ard/io

    struct Person {
      name: Str,
      age: Int,
    }

    enum Status {
      Active,
      Inactive,
    }

    fn greet(person: Person) Str {
      "Hello, {person.name}!"
    }

    fn main() {
      let person = Person{name: "Ada", age: 36}
      mut count = 0
      for i in 0..3 {
        count =+ i
      }
      if person.age > 18 {
        io::print(greet(person))
      }
      match Status::Active {
        Status::Active => io::print("active"),
        Status::Inactive => io::print("inactive"),
      }
    }

    """

    private static let queryFiles = ["highlights", "injections", "locals", "folds", "indents"]

    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_ard())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Ard grammar")
    }

    func testParsesSampleWithoutErrors() throws {
        let parser = Parser()
        try parser.setLanguage(Language(language: tree_sitter_ard()))

        let tree = try XCTUnwrap(parser.parse(Self.sample))
        let root = try XCTUnwrap(tree.rootNode)
        XCTAssertEqual(root.nodeType, "source_file")
        XCTAssertFalse(root.hasError, root.sExpressionString ?? "")
        XCTAssertGreaterThan(root.namedChildCount, 0)
    }

    func testQueriesAreBundledAsResources() throws {
        for name in Self.queryFiles {
            XCTAssertNotNil(try Self.queryURL(name), "\(name).scm is not in the TreeSitterArd resource bundle")
        }
    }

    func testHighlightsQueryCompilesAndCaptures() throws {
        let language = Language(language: tree_sitter_ard())
        let url = try XCTUnwrap(try Self.queryURL("highlights"))
        let query = try Query(language: language, url: url)
        XCTAssertGreaterThan(query.patternCount, 0)

        let parser = Parser()
        try parser.setLanguage(language)
        let tree = try XCTUnwrap(parser.parse(Self.sample))
        let captures = query.execute(in: tree).flatMap(\.captures).compactMap(\.name)
        XCTAssertTrue(captures.contains("keyword"), "captures: \(Set(captures).sorted())")
        XCTAssertTrue(captures.contains("string"), "captures: \(Set(captures).sorted())")
    }

    func testAllBundledQueriesCompile() throws {
        let language = Language(language: tree_sitter_ard())
        for name in Self.queryFiles {
            let url = try XCTUnwrap(try Self.queryURL(name), "\(name).scm missing")
            XCTAssertNoThrow(try Query(language: language, url: url), "\(name).scm does not compile")
        }
    }

    /// The query file in the resource bundle SwiftPM builds for the
    /// TreeSitterArd target. SwiftPM names the bundle after the package
    /// identity and Xcode after the package name, so match on the target suffix.
    private static func queryURL(_ name: String) throws -> URL? {
        let fileManager = FileManager.default
        var directories = [Bundle.main.resourceURL, Bundle.main.bundleURL].compactMap { $0 }
        for bundle in [Bundle(for: TreeSitterArdTests.self)] + Bundle.allBundles {
            directories.append(bundle.bundleURL.deletingLastPathComponent())
        }
        for directory in directories {
            let names = (try? fileManager.contentsOfDirectory(atPath: directory.path)) ?? []
            for bundleName in names where bundleName.hasSuffix("_TreeSitterArd.bundle") {
                let bundle = directory.appendingPathComponent(bundleName, isDirectory: true)
                for queries in ["queries", "Contents/Resources/queries"] {
                    let url = bundle.appendingPathComponent(queries).appendingPathComponent("\(name).scm")
                    if fileManager.fileExists(atPath: url.path) { return url }
                }
            }
        }
        return nil
    }
}
