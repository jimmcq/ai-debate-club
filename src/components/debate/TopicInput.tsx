'use client';

interface TopicInputProps {
    topic: string;
    onTopicChange: (topic: string) => void;
    onRandomTopic: () => void;
}

export default function TopicInput({
    topic,
    onTopicChange,
    onRandomTopic
}: TopicInputProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Debate Topic
            </h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder="Enter a debate topic (10-200 characters)"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    maxLength={200}
                />
                <button
                    onClick={onRandomTopic}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200 whitespace-nowrap"
                >
                    Surprise Me
                </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {topic.length}/200 characters
                {topic.length < 10 && topic.length > 0 && (
                    <span className="text-red-500 ml-2">
                        (Minimum 10 characters required)
                    </span>
                )}
            </div>
        </div>
    );
}