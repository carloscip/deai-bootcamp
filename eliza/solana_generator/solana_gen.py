from solana.keypair import Keypair
import base58

# Generar un nuevo Keypair
keypair = Keypair.generate()

# Clave pública (la dirección)
public_key = str(keypair.public_key)

# Clave privada en base58
private_key_base58 = base58.b58encode(keypair.secret_key).decode("utf-8")

print(f"🔐 Clave privada (base58): {private_key_base58}")
print(f"📬 Dirección pública (clave pública): {public_key}")
