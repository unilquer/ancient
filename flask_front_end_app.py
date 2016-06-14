import os, copy, json, collections, csv 
from flask import Flask, jsonify, request, send_from_directory, make_response
app = Flask(__name__, static_url_path='')

# get root
@app.route("/")
def index():
	return app.make_response(open('app/index.html').read())

# send assets (ex. assets/js/random_triangle_meshes/random_triangle_meshes.js)
# blocks other requests, so your directories won't get listed (ex. assets/js will return "not found")
@app.route('/assets/<path:path>')
def send_assets(path):
	return send_from_directory('app/assets/', path)

@app.route('/entities', methods=['GET'])
def get_entities():
	with open('app/assets/new_small_entities.csv', 'r') as f:
		data_file = f.read()
		return data_file

@app.route('/entities/limit/<int:n_entries>', methods=['GET'])
def get_entities_limit(n_entries):
	with open('app/assets/new_small_entities.csv') as f:
		data_file = f.read()
		return data_file[:n_entries]



if __name__ == "__main__":
	port = int(os.environ.get("PORT", 5050))
	app.run(host='0.0.0.0', port=port, debug=True)

# set debug=True if you want to have auto-reload on changes
# this is great for developing