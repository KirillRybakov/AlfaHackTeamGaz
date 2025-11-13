import { useState } from "react";
import apiClient from "../api/apiClient";
import Loader from "../components/Loader";

export default function SmartCalendar() {
  const [businessId, setBusinessId] = useState("");
  const [description, setDescription] = useState("");
  const [sales, setSales] = useState("");
  const [engagement, setEngagement] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setRecommendations([]);

    try {
      const response = await apiClient.post("/calendar/recommend", {
        business_id: parseInt(businessId),
        business_description: description,
        sales_summary: sales,
        engagement_summary: engagement,
        preferred_days: ["Понедельник", "Пятница"],
      });
      setRecommendations(response.data.recommendations);
    } catch (error) {
      console.error("Ошибка при получении рекомендаций:", error);
      alert("Ошибка: не удалось получить рекомендации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-center">
        🧠 Умный календарь
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white shadow p-4 rounded-2xl">
        <input
          type="number"
          placeholder="ID бизнеса"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="w-full border p-2 rounded-md"
          required
        />
        <textarea
          placeholder="Описание бизнеса"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded-md"
          required
        />
        <textarea
          placeholder="Краткая сводка продаж"
          value={sales}
          onChange={(e) => setSales(e.target.value)}
          className="w-full border p-2 rounded-md"
        />
        <textarea
          placeholder="Активность в соцсетях"
          value={engagement}
          onChange={(e) => setEngagement(e.target.value)}
          className="w-full border p-2 rounded-md"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md w-full"
        >
          {loading ? "Анализ..." : "Получить рекомендации"}
        </button>
      </form>

      {loading && <Loader />}

      {recommendations.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-xl shadow-sm">
          <h2 className="text-lg font-medium mb-3">📅 Рекомендации:</h2>
          <ul className="space-y-3">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="border border-gray-200 rounded-lg p-3 bg-white"
              >
                <p>
                  <strong>Тип:</strong> {rec.activity_type}
                </p>
                <p>
                  <strong>Дата:</strong> {rec.suggested_date}
                </p>
                <p>
                  <strong>Причина:</strong> {rec.reason}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
