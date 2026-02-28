import Foundation
import UIKit

struct ClothingItemDTO: Codable {
    let id: Int
    let ownerId: Int
    let originalUrl: String?
    let processedUrl: String
    let category: String
    let color: String?

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId = "owner_id"
        case originalUrl = "original_url"
        case processedUrl = "processed_url"
        case category
        case color
    }
}

struct UploadResponseDTO: Codable {
    let item: ClothingItemDTO
    let message: String
}

struct TryOnResponseDTO: Codable {
    let outfitId: Int
    let generatedImageUrl: String
    let message: String

    enum CodingKeys: String, CodingKey {
        case outfitId = "outfit_id"
        case generatedImageUrl = "generated_image_url"
        case message
    }
}

class APIClient {
    static let shared = APIClient()
    private let baseURL = "http://127.0.0.1:8000"
    
    private init() {}
    
    func fetchHealth(completion: @escaping (Result<Bool, Error>) -> Void) {
        guard let url = URL(string: baseURL + "/health") else { return }
        URLSession.shared.dataTask(with: url) { _, response, error in
            if let error {
                completion(.failure(error))
                return
            }
            let status = (response as? HTTPURLResponse)?.statusCode == 200
            completion(.success(status))
        }
        .resume()
    }
    
    func uploadImage(image: UIImage, ownerId: Int, completion: @escaping (Result<ClothingItemDTO, Error>) -> Void) {
        guard let url = URL(string: baseURL + "/api/upload/") else { return }
        guard let imageData = image.jpegData(compressionQuality: 0.8) else { return }
        
        let boundary = UUID().uuidString
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"owner_id\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(ownerId)\r\n".data(using: .utf8)!)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"photo.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
        
        URLSession.shared.uploadTask(with: request, from: body) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            guard let data = data else {
                completion(.failure(NSError(domain: "Network", code: 0, userInfo: [NSLocalizedDescriptionKey: "No response data"])))
                return
            }
            do {
                let decoded = try JSONDecoder().decode(UploadResponseDTO.self, from: data)
                completion(.success(decoded.item))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
    
    func fetchCloset(ownerId: Int, completion: @escaping (Result<[ClothingItemDTO], Error>) -> Void) {
        guard let url = URL(string: baseURL + "/api/closet/\(ownerId)") else { return }
        URLSession.shared.dataTask(with: url) { data, _, error in
            if let error {
                completion(.failure(error))
                return
            }
            guard let data else {
                completion(.failure(NSError(domain: "Network", code: 0, userInfo: [NSLocalizedDescriptionKey: "No response data"])))
                return
            }
            do {
                let decoded = try JSONDecoder().decode([ClothingItemDTO].self, from: data)
                completion(.success(decoded))
            } catch {
                completion(.failure(error))
            }
        }
        .resume()
    }

    func generateTryOn(
        userId: Int,
        topId: Int?,
        bottomId: Int?,
        shoesId: Int?,
        accessoryId: Int?,
        completion: @escaping (Result<TryOnResponseDTO, Error>) -> Void
    ) {
        guard let url = URL(string: baseURL + "/api/tryon/") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "user_id": userId,
            "top_id": topId,
            "bottom_id": bottomId,
            "shoes_id": shoesId,
            "accessory_id": accessoryId
        ].compactMapValues { $0 }
        
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let data = data else {
                completion(.failure(NSError(domain: "Network", code: 0, userInfo: [NSLocalizedDescriptionKey: "No response data"])))
                return
            }

            do {
                let decoded = try JSONDecoder().decode(TryOnResponseDTO.self, from: data)
                completion(.success(decoded))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}