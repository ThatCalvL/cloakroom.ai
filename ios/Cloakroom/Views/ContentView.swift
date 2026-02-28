import SwiftUI

struct ContentView: View {
    @State private var showingCamera = false

    var body: some View {
        TabView {
            ClosetView()
                .tabItem {
                    Label("Closet", systemImage: "tshirt")
                }
            
            StylingView()
                .tabItem {
                    Label("Styling", systemImage: "sparkles")
                }
            
            Text("Profile")
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle")
                }
        }
        .overlay(
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button(action: {
                        showingCamera = true
                    }) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.blue)
                            .clipShape(Circle())
                            .shadow(radius: 5)
                    }
                    .padding(.bottom, 60) // Offset for TabBar
                    .padding(.trailing, 20)
                }
            }
        )
        .sheet(isPresented: $showingCamera) {
            CameraView()
        }
    }
}