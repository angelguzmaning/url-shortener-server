db.shortened_urls.drop()
db.shortened_urls.createIndex({ id: 1 }, { unique: true })