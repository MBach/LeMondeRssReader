package org.mbach.lemonde.article;

import android.util.Log;
import android.widget.TextView;

import androidx.test.core.app.ApplicationProvider;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;

import static org.junit.Assert.assertEquals;

@RunWith(RobolectricTestRunner.class)
public class ArticleHtmlParserTest
{

    private ArrayList<Model> models;

    @Before
    public void setUp() {
        ArticleHtmlParser parser = new ArticleHtmlParser(ApplicationProvider.getApplicationContext());
        try {
            Document liveDoc = this.loadLivePage();
            this.models = parser.parse(liveDoc);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private Document loadLivePage() throws IOException {
        InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream("fixtures/page_live.html");
        return Jsoup.parse(inputStream, "UTF-8", "http://lemonde.fr");
    }

    @Test
    public void parseLive_NbModelsOK() {
        assertEquals("Number of models correct", 22, this.models.size());
    }

    @Test
    public void parseLive_titleOK() {
        assertEquals("Title found", "Lyon - Juventus : l’OL remporte le bras de fer et s’impose face à la Juve", this.getContentFromViewIndex(0));
    }

    @Test
    public void parseLive_descriptionOK() {
        assertEquals("Description found", "Tantôt dominateurs, tantôt sur le reculoir, les coéquipiers de Lucas Tousart, buteur, ont battu la Juve de Cristiano Ronaldo en huitièmes de finale aller, mercredi (1-0).", this.getContentFromViewIndex(1));
    }

    @Test
    public void parseLive_modelTextImageOK() {
        LiveModel model = this.getLiveModelFromIndex(2);

        assertEquals("Number of submodels correct", 4, model.getSubModels().size());
    }

    private String getContentFromViewIndex(int index) {
        Model model = models.get(index);
        return ((TextView) model.getTheContent()).getText().toString();
    }

    private LiveModel getLiveModelFromIndex(int index) {
        return (LiveModel) models.get(index);
    }

}
