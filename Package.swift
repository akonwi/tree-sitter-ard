// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterArd",
    products: [
        .library(name: "TreeSitterArd", targets: ["TreeSitterArd"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.25.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterArd",
            dependencies: [],
            path: ".",
            sources: [
                // Listed explicitly (not probed with FileManager) so SwiftPM
                // finds them regardless of the working directory. Add
                // "src/scanner.c" here if the grammar gains an external scanner.
                "src/parser.c",
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterArdTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterArd",
            ],
            path: "bindings/swift/TreeSitterArdTests"
        )
    ],
    cLanguageStandard: .c11
)
