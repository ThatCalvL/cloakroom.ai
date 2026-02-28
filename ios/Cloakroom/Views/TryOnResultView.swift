import SwiftUI

struct TryOnResultView: View {
    @Environment(\.dismiss) var dismiss
    let imageUrl: String
    
    var body: some View {
        NavigationView {
            VStack {
                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                        .cornerRadius(12)
                        .padding()
                } placeholder: {
                    ProgressView()
                }
                
                Spacer()
                
                HStack(spacing: 20) {
                    Button(action: {
                        // Action to save outfit to wardrobe
                        dismiss()
                    }) {
                        Text("Save Outfit")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.black)
                            .foregroundColor(.white)
                            .cornerRadius(10)
                    }
                    
                    Button(action: {
                        dismiss()
                    }) {
                        Text("Discard")
                            .bold()
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.black)
                            .cornerRadius(10)
                    }
                }
                .padding()
            }
            .navigationTitle("Your Look")
            .navigationBarItems(trailing: Button("Done") {
                dismiss()
            })
        }
    }
}