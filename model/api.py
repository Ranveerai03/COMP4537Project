from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

app = FastAPI()

API_KEY = "3a7f8c9e2b1d4a6f5e8c9a2b3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2"

security = HTTPBearer()

def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify the API key from Authorization header"""
    if credentials.credentials != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key"
        )
    return credentials.credentials

model_name = "HuggingFaceTB/SmolLM2-1.7B-Instruct"
print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print(f"Model loaded on {device}")

@app.get("/")
def read_root():
    return {"status": "ML API is running", "model": model_name}

@app.post("/generate")
def generate_text(
    prompt: str, 
    max_tokens: int = 100,
    api_key: str = Depends(verify_api_key)
):
    """Generate text using the model (requires API key)"""
    messages = [{"role": "user", "content": prompt}]
    text = tokenizer.apply_chat_template(
        messages, 
        tokenize=False, 
        add_generation_prompt=True
    )
    inputs = tokenizer([text], return_tensors="pt").to(device)
    outputs = model.generate(**inputs, max_new_tokens=max_tokens)
    output_ids = outputs[0][len(inputs.input_ids[0]):]
    response = tokenizer.decode(output_ids, skip_special_tokens=True)
    
    return {"prompt": prompt, "response": response}