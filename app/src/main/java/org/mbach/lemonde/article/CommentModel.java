package org.mbach.lemonde.article;

class CommentModel extends Model {

    private String author;
    private String date;
    private String content;

    CommentModel(int type) {
        super(type);
    }

    String getAuthor() {
        return author;
    }

    void setAuthor(String author) {
        this.author = author;
    }

    String getDate() {
        return date;
    }

    void setDate(String date) {
        this.date = date;
    }

    String getContent() {
        return content;
    }

    void setContent(String content) {
        this.content = content;
    }
}
