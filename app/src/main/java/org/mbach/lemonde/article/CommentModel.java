package org.mbach.lemonde.article;

import java.util.ArrayList;
import java.util.List;

class CommentModel extends Model {

    private List<CommentModel> responses = new ArrayList<>();
    private String author;
    private String date;
    private String content;

    CommentModel() {
        super(Model.COMMENT_TYPE);
    }

    public List<CommentModel> getResponses() {
        return responses;
    }

    public void setResponses(List<CommentModel> responses) {
        this.responses = responses;
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
