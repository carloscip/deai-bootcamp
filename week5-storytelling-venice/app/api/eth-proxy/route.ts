import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    // Obtenemos la URL de RPC del servidor desde variables de entorno
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    
    if (!rpcUrl) {
      return NextResponse.json(
        { error: 'RPC URL no configurada en el servidor' },
        { status: 500 }
      );
    }

    // Formato correcto para JSON-RPC 2.0
    const rpcRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: payload.method,
      params: payload.params
    };

    // Enviamos la solicitud correctamente formateada a Alchemy
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rpcRequest),
    });

    // Obtenemos la respuesta de Alchemy
    const data = await response.json();
    
    // Devolvemos la respuesta al cliente
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el proxy de Ethereum:', error);
    return NextResponse.json(
      { 
        jsonrpc: "2.0", 
        id: null, 
        error: { 
          code: -32603, 
          message: 'Error interno del servidor proxy' 
        } 
      },
      { status: 500 }
    );
  }
}
