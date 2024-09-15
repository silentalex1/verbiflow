from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

# Load the GPT-J model and tokenizer
model_name = "EleutherAI/gpt-j-6B"
try:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    gptj_pipeline = pipeline("text-generation", model=model, tokenizer=tokenizer)
except Exception as e:
    print(f"Error loading GPT-J model: {e}")

def generate_response(prompt):
    try:
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(**inputs, max_length=100)
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
    except Exception as e:
        return f"AI Error: Failed to generate response using GPT-J. {str(e)}"

# Example usage
if __name__ == "__main__":
    prompt = "What is the capital of France?"
    response = generate_response(prompt)
    print(f"Response: {response}")
