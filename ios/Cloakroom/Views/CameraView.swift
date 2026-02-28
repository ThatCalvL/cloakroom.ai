import SwiftUI
import PhotosUI
import SwiftData

struct CameraView: View {
    @Environment(\.dismiss) var dismiss
    @Environment(\.modelContext) private var modelContext
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedImage: UIImage?
    @State private var isUploading = false
    @State private var uploadStatus = ""

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                if let image = selectedImage {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 400)
                        .cornerRadius(12)
                        .padding()
                    
                    if isUploading {
                        ProgressView("Uploading...")
                    } else {
                        Text(uploadStatus)
                            .foregroundColor(uploadStatus.contains("Error") ? .red : .green)
                        
                        Button(action: uploadImage) {
                            Text("Save to Closet")
                                .bold()
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                        }
                        .padding(.horizontal)
                    }
                } else {
                    Text("Select a clear photo of one clothing item.")
                        .foregroundColor(.gray)
                    Text("Tip: Place the item on a plain, high-contrast background.")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                        .padding(.horizontal)
                    
                    PhotosPicker("Choose Photo", selection: $selectedItem, matching: .images)
                        .onChange(of: selectedItem) { newItem in
                            Task {
                                if let data = try? await newItem?.loadTransferable(type: Data.self),
                                   let image = UIImage(data: data) {
                                    self.selectedImage = image
                                }
                            }
                        }
                }
            }
            .navigationTitle("Add to Closet")
            .navigationBarItems(trailing: Button("Cancel") {
                dismiss()
            })
        }
    }
    
    private func uploadImage() {
        guard let image = selectedImage else { return }
        isUploading = true
        uploadStatus = ""
        
        APIClient.shared.uploadImage(image: image, ownerId: 1) { result in
            DispatchQueue.main.async {
                isUploading = false
                switch result {
                case .success(let item):
                    upsertLocalItem(item)
                    uploadStatus = "Added to closet as \(item.category)."
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        dismiss()
                    }
                case .failure(let error):
                    uploadStatus = "Error: \(error.localizedDescription)"
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
            let localItem = ClothingItem(
                serverId: item.id,
                processedUrl: item.processedUrl,
                originalUrl: item.originalUrl,
                category: item.category,
                color: item.color
            )
            modelContext.insert(localItem)
        }
    }
}