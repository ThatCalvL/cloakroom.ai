import Foundation
import SwiftData

@Model
final class ClothingItem {
    @Attribute(.unique) var serverId: Int
    var processedUrl: String
    var originalUrl: String?
    var category: String
    var color: String?
    var createdAt: Date
    
    init(
        serverId: Int,
        processedUrl: String,
        originalUrl: String? = nil,
        category: String,
        color: String? = nil,
        createdAt: Date = Date()
    ) {
        self.serverId = serverId
        self.processedUrl = processedUrl
        self.originalUrl = originalUrl
        self.category = category
        self.color = color
        self.createdAt = createdAt
    }
}