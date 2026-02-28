import SwiftUI
import SwiftData

struct ClosetView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \ClothingItem.createdAt, order: .reverse) private var clothingItems: [ClothingItem]

    @State private var syncStatus: String = ""
    @State private var isSyncing = false

    var body: some View {
        NavigationView {
            List {
                if clothingItems.isEmpty {
                    Text("Your closet is empty. Add a clothing photo to get started.")
                        .foregroundColor(.secondary)
                } else {
                    ForEach(clothingItems) { item in
                        HStack(spacing: 12) {
                            AsyncImage(url: URL(string: "http://127.0.0.1:8000" + item.processedUrl)) { image in
                                image
                                    .resizable()
                                    .scaledToFill()
                            } placeholder: {
                                Color.gray.opacity(0.15)
                            }
                            .frame(width: 56, height: 56)
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                            VStack(alignment: .leading, spacing: 4) {
                                Text(item.category.capitalized)
                                    .font(.headline)
                                if let color = item.color {
                                    Text("Color: \(color)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Digital Closet")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if isSyncing {
                        ProgressView()
                    } else {
                        Button("Sync") {
                            syncCloset()
                        }
                    }
                }
            }
            .overlay(alignment: .bottom) {
                if !syncStatus.isEmpty {
                    Text(syncStatus)
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.black.opacity(0.75))
                        .foregroundColor(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .padding()
                }
            }
        }
    }

    private func syncCloset() {
        isSyncing = true
        syncStatus = ""

        APIClient.shared.fetchCloset(ownerId: 1) { result in
            DispatchQueue.main.async {
                isSyncing = false
                switch result {
                case .success(let remoteItems):
                    for item in remoteItems {
                        upsertLocalItem(item)
                    }
                    syncStatus = "Closet synced."
                case .failure(let error):
                    syncStatus = "Sync failed: \(error.localizedDescription)"
                }
            }
        }
    }

    private func upsertLocalItem(_ item: ClothingItemDTO) {
        let descriptor = FetchDescriptor<ClothingItem>(
            predicate: #Predicate { $0.serverId == item.id }
        )
        if let existing = try? modelContext.fetch(descriptor).first {
            existing.processedUrl = item.processedUrl
            existing.originalUrl = item.originalUrl
            existing.category = item.category
            existing.color = item.color
        } else {
            modelContext.insert(
                ClothingItem(
                    serverId: item.id,
                    processedUrl: item.processedUrl,
                    originalUrl: item.originalUrl,
                    category: item.category,
                    color: item.color
                )
            )
        }
    }
}
