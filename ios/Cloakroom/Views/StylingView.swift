import SwiftUI
import SwiftData

struct StylingView: View {
    @Query private var clothingItems: [ClothingItem]
    
    var tops: [ClothingItem] { clothingItems.filter { $0.category == "top" } }
    var bottoms: [ClothingItem] { clothingItems.filter { $0.category == "bottom" } }
    var shoes: [ClothingItem] { clothingItems.filter { $0.category == "shoes" } }
    var accessories: [ClothingItem] { clothingItems.filter { $0.category == "accessory" } }
    
    @State private var selectedTopIndex = 0
    @State private var selectedBottomIndex = 0
    @State private var selectedShoesIndex = 0
    @State private var selectedAccessoryIndex = 0
    @State private var isGeneratingTryOn = false
    @State private var showResult = false
    @State private var resultUrl: String = ""
    @State private var errorMessage: String?
    
    var body: some View {
        NavigationView {
            VStack {
                Text("Mix & Match")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top)
                
                if let errorMessage = errorMessage {
                    Text(errorMessage)
                        .foregroundColor(.red)
                        .padding()
                }
                
                Spacer()
                
                // Tops Carousel
                ClothingCarouselView(items: tops, title: "Tops", selectedIndex: $selectedTopIndex)
                    .frame(height: 150)
                
                // Bottoms Carousel
                ClothingCarouselView(items: bottoms, title: "Bottoms", selectedIndex: $selectedBottomIndex)
                    .frame(height: 150)
                
                // Shoes Carousel
                ClothingCarouselView(items: shoes, title: "Shoes", selectedIndex: $selectedShoesIndex)
                    .frame(height: 150)

                // Accessories Carousel
                ClothingCarouselView(items: accessories, title: "Accessories", selectedIndex: $selectedAccessoryIndex)
                    .frame(height: 150)
                
                Spacer()
                
                Button(action: generateTryOn) {
                    if isGeneratingTryOn {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            .padding()
                    } else {
                        Text("Try it On")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.black)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
                .padding(.horizontal)
                .padding(.bottom, 20)
                .disabled(tops.isEmpty && bottoms.isEmpty)
            }
            .background(Color(UIColor.systemGroupedBackground).edgesIgnoringSafeArea(.all))
            .sheet(isPresented: $showResult) {
                TryOnResultView(imageUrl: resultUrl)
            }
        }
    }
    
    private func generateTryOn() {
        isGeneratingTryOn = true
        errorMessage = nil
        
        let selectedTopId = selectedItemId(from: tops, index: selectedTopIndex)
        let selectedBottomId = selectedItemId(from: bottoms, index: selectedBottomIndex)
        let selectedShoesId = selectedItemId(from: shoes, index: selectedShoesIndex)
        let selectedAccessoryId = selectedItemId(from: accessories, index: selectedAccessoryIndex)

        APIClient.shared.generateTryOn(
            userId: 1,
            topId: selectedTopId,
            bottomId: selectedBottomId,
            shoesId: selectedShoesId,
            accessoryId: selectedAccessoryId
        ) { result in
            DispatchQueue.main.async {
                isGeneratingTryOn = false
                switch result {
                case .success(let payload):
                    self.resultUrl = payload.generatedImageUrl
                    self.showResult = true
                case .failure(let error):
                    self.errorMessage = "Failed to generate: \(error.localizedDescription)"
                }
            }
        }
    }

    private func selectedItemId(from items: [ClothingItem], index: Int) -> Int? {
        guard !items.isEmpty else { return nil }
        let safeIndex = min(max(index, 0), items.count - 1)
        return items[safeIndex].serverId
    }
}

struct ClothingCarouselView: View {
    let items: [ClothingItem]
    let title: String
    @Binding var selectedIndex: Int
    
    var body: some View {
        VStack(alignment: .leading) {
            Text(title)
                .font(.headline)
                .padding(.horizontal)
            
            if items.isEmpty {
                Text("No \(title.lowercased()) found")
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.white)
                    .cornerRadius(8)
                    .padding(.horizontal)
            } else {
                TabView(selection: $selectedIndex) {
                    ForEach(0..<items.count, id: \.self) { index in
                        AsyncImage(url: URL(string: "http://127.0.0.1:8000" + items[index].processedUrl)) { image in
                            image.resizable()
                                 .scaledToFit()
                        } placeholder: {
                            ProgressView()
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.white)
                        .cornerRadius(8)
                        .padding(.horizontal)
                        .tag(index)
                    }
                }
                .tabViewStyle(PageTabViewStyle(indexDisplayMode: .never))
            }
        }
    }
}