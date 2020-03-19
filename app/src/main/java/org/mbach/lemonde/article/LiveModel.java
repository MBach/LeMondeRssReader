package org.mbach.lemonde.article;

import java.util.ArrayList;
import java.util.List;

class LiveModel extends Model {

    private final ArrayList<SubModel> subModels;
    private String authorName;
    private String authorAvatar;
    private String date;

    LiveModel() {
        super(Model.LIVE_TYPE, null, 0);
        this.subModels = new ArrayList<>();
    }

    String getAuthorName() {
        return this.authorName;
    }

    void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    String getAuthorAvatar() {
        return authorAvatar;
    }

    void setAuthorAvatar(String authorAvatar) {
        this.authorAvatar = authorAvatar;
    }

    String getDate() {
        return date;
    }

    void setDate(String date) {
        this.date = date;
    }

    List<SubModel> getSubModels() {
        return this.subModels;
    }

    void addSubModels(List<SubModel> subModels) {
        this.subModels.addAll(subModels);
    }

    Paragraph buildParagraph(String html) {
        Paragraph paragraph = new Paragraph();
        paragraph.setHtml(html);
        return paragraph;
    }

    Image buildImage(String url) {
        Image image = new Image();
        image.setUrl(url);

        return image;
    }

    /*
    Quote buildQuote(String html) {
        Quote quote = new Quote();
        quote.setHtml(html);
        return quote;
    }
    */

    static class SubModel {

    }

    static class Quote extends SubModel {
        private String html;

        public String getHtml() {
            return html;
        }

        public void setHtml(String html) {
            this.html = html;
        }
    }

    static class Image extends SubModel {
        private String url;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

    /*
    static class Video extends SubModel {

    }
    */

    static class Paragraph extends SubModel {
        private String html;

        public String getHtml() {
            return html;
        }

        public void setHtml(String html) {
            this.html = html;
        }
    }
}
