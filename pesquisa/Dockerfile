FROM python:3.12-slim

# /work espelha a raiz do repositório: os comandos usam os mesmos caminhos que no host.
WORKDIR /work

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8888
CMD ["jupyter", "lab", "--ip=0.0.0.0", "--port=8888", "--no-browser", "--allow-root", "--ServerApp.token=", "--notebook-dir=/work/pesquisa/notebooks"]
