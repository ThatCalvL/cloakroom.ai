Cloakroom.ai Development Plan

This document outlines the architectural and organizational standard development plan for Cloakroom.ai. It is designed to act as a comprehensive blueprint for any incoming AI agent or human developer to implement the Native iOS application and its accompanying AI-driven backend infrastructure.

1. Architecture & Technology Stack

Frontend (iOS App):





Framework: Native iOS using SwiftUI.



Architecture Pattern: MVVM (Model-View-ViewModel).



Local Storage: SwiftData or CoreData for offline caching of the wardrobe to ensure immediate UI responsiveness when swiping through clothes.



Media Handling: AVFoundation for custom camera controls and image capture guidelines.

Backend & Infrastructure:





API Layer: Python (FastAPI). Chosen for its native asynchronous support and seamless integration with ML libraries.



Database: PostgreSQL for relational data (users, categories, outfits) and AWS S3 (or similar blob storage) for high-resolution image assets.



Hosting: Render, Railway, or AWS ECS for the API.

AI / Machine Learning Stack:





Item Digitization (Preprocessing):





Background Removal: rembg (U^2-Net) or Apple's native Vision framework (Subject Lifting in iOS 17+) to reduce server load.



Auto-Categorization: A lightweight Vision Transformer (ViT) or ResNet to automatically tag (Top, Bottom, Shoes, Outerwear) and detect colors.



Virtual Try-On (VTON):





Model: State-of-the-art open-source VTON models like IDM-VTON or OOTDiffusion.



Deployment: Serverless GPU instances (e.g., Modal, RunPod, or Replicate) to handle heavy diffusion model inference, scaling to zero when not in use to optimize costs.



2. Core Features & User Flow





Onboarding & Avatar Setup: User creates an account and uploads a full-body base photo of themselves (the "Avatar" for the AI Try-On).



Digitizing the Closet: User takes a photo of a clothing item. The app guides them to place it flat on a contrasting background. The background is removed, and the item is auto-tagged and saved to their digital closet.



The "Swipe" Styling Interface: A carousel-based UI where users can horizontally swipe through Tops, Bottoms, and Accessories independently to build an outfit combination.



AI Try-On Execution: Once an outfit is assembled, the user taps "Try it On". The backend composites the selected garments onto the user's base photo using the VTON model and returns a realistic image of them wearing the outfit.



3. Implementation Phases

Phase 1: Foundation & DevOps





Initialize the SwiftUI iOS repository and FastAPI backend repository.



Set up PostgreSQL database schemas (User, ClothingItem, Category, Outfit).



Configure API routing, authentication (JWT/Apple Sign-in), and S3 bucket connections.

Phase 2: iOS Core & Digital Closet





Build the camera interface with overlay guides for capturing clothing.



Implement the API integration for uploading items and fetching the closet.



Integrate background removal (evaluating local iOS Vision API vs. server-side rembg).

Phase 3: The Styling UI (Mix & Match)





Develop the interactive swipe interface for mixing Tops, Bottoms, and Accessories.



Implement SwiftData caching so images load instantly while swiping.



Create the "Outfit Builder" state management in SwiftUI.

Phase 4: AI Virtual Try-On Pipeline





Deploy the chosen VTON model (e.g., IDM-VTON) to a GPU provider (Modal/RunPod).



Create the backend orchestration: receiving the base photo + garment images, formatting them for the ML model, queueing the inference job, and returning the result.



Implement polling or WebSockets in the iOS app to handle the 5-15 second wait time during generation gracefully.

Phase 5: Polish & Edge Cases





Implement loading skeletons, error handling, and offline fallbacks.



Refine the auto-categorization ML model's accuracy.



4. Potential Issues & Strategic Suggestions





VTON Latency: Generating realistic AI try-ons takes significant compute time (5-20 seconds).





Suggestion: Implement an engaging, animated "Styling..." loading screen. Use asynchronous processing so the user can continue building other outfits while one is generating.



Input Image Quality: The phrase "garbage in, garbage out" applies heavily to VTON. If the user takes a blurry photo of a crumpled shirt on a messy bed, the AI will fail.





Suggestion: Add strict UI overlays in the camera (e.g., "Place item inside the box", "Ensure good lighting"). Consider adding a lightweight pre-processing model that rejects bad photos immediately before attempting to process them.



Layering Complexity: Models struggle with complex styling decisions like "should this shirt be tucked in or untucked?".





Suggestion: Allow users to specify a simple flag (tucked/untucked) that can be passed as a text prompt to the diffusion model to guide the generation.



Infrastructure Costs: Always-on GPUs are incredibly expensive.





Suggestion: Strictly use Serverless GPU platforms (Modal, Baseten, Replicate) for the VTON inference to ensure you only pay for the exact seconds the AI is computing an image.



Privacy: Users are uploading personal photos of their bodies and clothes.





Suggestion: Ensure strict S3 bucket policies, auto-delete try-on generations if not explicitly saved, and state clear privacy policies regarding the base avatar photos.

